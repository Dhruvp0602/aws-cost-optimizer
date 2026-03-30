import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeAddressesCommand, DescribeNatGatewaysCommand, DescribeSnapshotsCommand } from "@aws-sdk/client-ec2";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";

// ─── All regions to scan ──────────────────────────────────────────────────────
const ALL_REGIONS = [
  "ap-south-1",       // Asia Pacific (Mumbai)
  "ap-southeast-1",   // Asia Pacific (Singapore)
  "ap-southeast-2",   // Asia Pacific (Sydney)
  "ap-northeast-1",   // Asia Pacific (Tokyo)
  "ap-northeast-2",   // Asia Pacific (Seoul)
  "us-east-1",        // US East (N. Virginia)
  "us-east-2",        // US East (Ohio)
  "us-west-1",        // US West (N. California)
  "us-west-2",        // US West (Oregon)
  "eu-west-1",        // Europe (Ireland)
  "eu-west-2",        // Europe (London)
  "eu-central-1",     // Europe (Frankfurt)
  "ca-central-1",     // Canada (Central)
];

const defaultRegion = process.env.REACT_APP_AWS_REGION || "ap-south-1";
const roleArn = process.env.REACT_APP_AWS_ROLE_ARN;
const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;

const hasCredentials = accessKeyId && secretAccessKey &&
  accessKeyId !== 'YOUR_AWS_ACCESS_KEY_HERE';

// ─── Resolve Credentials (AssumeRole only when cross-account ARN is given) ───
const resolveCredentials = async (overrideRoleArn) => {
  if (!hasCredentials) throw new Error("NO_CREDENTIALS");

  const activeRoleArn = overrideRoleArn || null;

  if (activeRoleArn) {
    const sts = new STSClient({ region: defaultRegion, credentials: { accessKeyId, secretAccessKey } });
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

  return { accessKeyId, secretAccessKey };
};

// ─── Get Account ID ───────────────────────────────────────────────────────────
export const fetchAWSAccountId = async (overrideRoleArn) => {
  const creds = await resolveCredentials(overrideRoleArn);
  const sts = new STSClient({ region: defaultRegion, credentials: creds });
  const res = await sts.send(new GetCallerIdentityCommand({}));
  return res.Account;
};

// ─── Scan a single region ─────────────────────────────────────────────────────
const scanRegion = async (regionName, creds, ownerId) => {
  const ec2 = new EC2Client({ region: regionName, credentials: creds });
  const elb = new ElasticLoadBalancingV2Client({ region: regionName, credentials: creds });
  const resources = [];

  const [ec2Res, volRes, ipRes, natRes, snapRes, lbRes] = await Promise.allSettled([
    ec2.send(new DescribeInstancesCommand({})),
    ec2.send(new DescribeVolumesCommand({})),
    ec2.send(new DescribeAddressesCommand({})),
    ec2.send(new DescribeNatGatewaysCommand({})),
    ownerId
      ? ec2.send(new DescribeSnapshotsCommand({ Filters: [{ Name: "owner-id", Values: [ownerId] }] }))
      : Promise.reject("no owner id"),
    elb.send(new DescribeLoadBalancersCommand({})),
  ]);

  // EC2 Instances - Filter out 'terminated'
  if (ec2Res.status === 'fulfilled') {
    ec2Res.value.Reservations?.forEach(r =>
      r.Instances?.filter(inst => inst.State?.Name !== 'terminated').forEach(inst => {
        const name = inst.Tags?.find(t => t.Key === 'Name')?.Value || inst.InstanceId;
        resources.push({
          id: inst.InstanceId,
          type: "EC2 Instance",
          name,
          state: inst.State?.Name,
          size: inst.InstanceType,
          az: inst.Placement?.AvailabilityZone,
          region: regionName,
          launchTime: inst.LaunchTime,
          isIdle: inst.State?.Name === 'stopped',
        });
      })
    );
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
        region: regionName,
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
        az: regionName,
        region: regionName,
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
        az: regionName,
        region: regionName,
        launchTime: gw.CreateTime,
        isIdle: gw.State === 'available',
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
        az: regionName,
        region: regionName,
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
        az: lb.AvailabilityZones?.[0]?.ZoneName || regionName,
        region: regionName,
        launchTime: lb.CreatedTime,
        isIdle: false,
      });
    });
  }

  return resources;
};

// ─── Full Multi-Region Resource Scan ─────────────────────────────────────────
export const fetchAllAWSResources = async (overrideRoleArn) => {
  const creds = await resolveCredentials(overrideRoleArn);

  // Get the owner account ID once (for snapshot filtering)
  let ownerId = null;
  try {
    const sts = new STSClient({ region: defaultRegion, credentials: creds });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    ownerId = identity.Account;
  } catch (e) {
    console.warn("Could not get caller identity, skipping snapshot owner filter");
  }

  // Scan all regions in parallel
  const regionResults = await Promise.allSettled(
    ALL_REGIONS.map(r => scanRegion(r, creds, ownerId))
  );

  // Flatten all results into one array
  const allResources = [];
  regionResults.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allResources.push(...result.value);
    } else {
      console.warn(`Region ${ALL_REGIONS[i]} scan failed:`, result.reason?.message || result.reason);
    }
  });

  return allResources;
};

export const isConfigured = () => hasCredentials;
