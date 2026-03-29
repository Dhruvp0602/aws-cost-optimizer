import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeAddressesCommand, DescribeNatGatewaysCommand, DescribeSnapshotsCommand } from "@aws-sdk/client-ec2";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";

const region = process.env.REACT_APP_AWS_REGION || "ap-south-1";
const roleArn = process.env.REACT_APP_AWS_ROLE_ARN;
const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;

const hasCredentials = accessKeyId && secretAccessKey &&
  accessKeyId !== 'YOUR_AWS_ACCESS_KEY_HERE';

// ─── Resolve Credentials (AssumeRole only when cross-account ARN is given) ───
const resolveCredentials = async (overrideRoleArn) => {
  if (!hasCredentials) throw new Error("NO_CREDENTIALS");

  // Only use AssumeRole if an explicit cross-account ARN is provided
  const activeRoleArn = overrideRoleArn || null;

  if (activeRoleArn) {
    const sts = new STSClient({ region, credentials: { accessKeyId, secretAccessKey } });
    const res = await sts.send(new AssumeRoleCommand({
      RoleArn: activeRoleArn,
      RoleSessionName: "cost-optimizer-scan",
      DurationSeconds: 3600,
    }));
    return {
      accessKeyId: res.Credentials.AccessKeyId,
      secretAccessKey: res.Credentials.SecretAccessKey,
      sessionToken: res.Credentials.SessionToken,
    };
  }

  // No ARN = scan own account directly with IAM user credentials (no CORS issue)
  return { accessKeyId, secretAccessKey };
};

// ─── Get Account ID ───────────────────────────────────────────────────────────
export const fetchAWSAccountId = async (overrideRoleArn) => {
  const creds = await resolveCredentials(overrideRoleArn);
  const sts = new STSClient({ region, credentials: creds });
  const res = await sts.send(new GetCallerIdentityCommand({}));
  return res.Account;
};

// ─── Full Resource Scan (Read-Only, 100% Free) ────────────────────────────────
export const fetchAllAWSResources = async (overrideRoleArn) => {
  const creds = await resolveCredentials(overrideRoleArn);
  const ec2 = new EC2Client({ region, credentials: creds });
  const elb = new ElasticLoadBalancingV2Client({ region, credentials: creds });

  const [ec2Res, volRes, ipRes, natRes, snapRes, lbRes] = await Promise.allSettled([
    ec2.send(new DescribeInstancesCommand({})),
    ec2.send(new DescribeVolumesCommand({})),
    ec2.send(new DescribeAddressesCommand({})),
    ec2.send(new DescribeNatGatewaysCommand({})),
    ec2.send(new DescribeSnapshotsCommand({ Filters: [{ Name: "owner-id", Values: [await fetchAWSAccountId()] }] })),
    elb.send(new DescribeLoadBalancersCommand({})),
  ]);

  const resources = [];

  // EC2 Instances - Filter out 'terminated'
  if (ec2Res.status === 'fulfilled') {
    ec2Res.value.Reservations?.forEach(r => r.Instances?.filter(inst => inst.State?.Name !== 'terminated').forEach(inst => {
      const name = inst.Tags?.find(t => t.Key === 'Name')?.Value || inst.InstanceId;
      resources.push({
        id: inst.InstanceId,
        type: "EC2 Instance",
        name,
        state: inst.State?.Name,
        size: inst.InstanceType,
        az: inst.Placement?.AvailabilityZone,
        launchTime: inst.LaunchTime,
        isIdle: inst.State?.Name === 'stopped',
      });
    }));
  }

  // EBS Volumes - Filter out 'deleting' 
  if (volRes.status === 'fulfilled') {
    volRes.value.Volumes?.filter(vol => vol.State !== 'deleting' && vol.State !== 'deleted').forEach(vol => {
      const name = vol.Tags?.find(t => t.Key === 'Name')?.Value || vol.VolumeId;
      resources.push({
        id: vol.VolumeId,
        type: "EBS Volume",
        name,
        state: vol.State,
        size: `${vol.Size} GB (${vol.VolumeType})`,
        az: vol.AvailabilityZone,
        launchTime: vol.CreateTime,
        isIdle: vol.Attachments?.length === 0,
      });
    });
  }

  // Elastic IPs
  if (ipRes.status === 'fulfilled') {
    ipRes.value.Addresses?.forEach(addr => {
      resources.push({
        id: addr.AllocationId || addr.PublicIp,
        type: "Elastic IP",
        name: addr.PublicIp,
        state: addr.AssociationId ? 'associated' : 'unassociated',
        size: addr.Domain,
        az: region,
        launchTime: null,
        isIdle: !addr.AssociationId,
      });
    });
  }

  // NAT Gateways - Filter out 'deleted'
  if (natRes.status === 'fulfilled') {
    natRes.value.NatGateways?.filter(gw => gw.State !== 'deleted' && gw.State !== 'deleting').forEach(gw => {
      const name = gw.Tags?.find(t => t.Key === 'Name')?.Value || gw.NatGatewayId;
      resources.push({
        id: gw.NatGatewayId,
        type: "NAT Gateway",
        name,
        state: gw.State,
        size: gw.ConnectivityType || 'public',
        az: region,
        launchTime: gw.CreateTime,
        isIdle: gw.State === 'available', // Suggest review for any existing NAT Gateway
      });
    });
  }

  // Snapshots
  if (snapRes.status === 'fulfilled') {
    snapRes.value.Snapshots?.forEach(snap => {
      const name = snap.Tags?.find(t => t.Key === 'Name')?.Value || snap.SnapshotId;
      resources.push({
        id: snap.SnapshotId,
        type: "Snapshot",
        name,
        state: snap.State,
        size: `${snap.VolumeSize} GB`,
        az: region,
        launchTime: snap.StartTime,
        isIdle: !snap.Description?.includes('Created by'),
      });
    });
  }

  // Load Balancers - Filter out 'deleted'
  if (lbRes.status === 'fulfilled') {
    lbRes.value.LoadBalancers?.filter(lb => lb.State?.Code !== 'deleted').forEach(lb => {
      resources.push({
        id: lb.LoadBalancerArn,
        type: `Load Balancer (${lb.Type?.toUpperCase() || 'ALB'})`,
        name: lb.LoadBalancerName,
        state: lb.State?.Code,
        size: lb.Scheme,
        az: lb.AvailabilityZones?.[0]?.ZoneName || region,
        launchTime: lb.CreatedTime,
        isIdle: false,
      });
    });
  }

  return resources;
};

export const isConfigured = () => hasCredentials;
