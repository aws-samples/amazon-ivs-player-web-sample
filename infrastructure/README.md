# Multi-Angle IVS Player Infrastructure

This directory contains infrastructure-as-code for deploying a multi-angle IVS streaming solution.

## Architecture

- **S3 Bucket**: Static website hosting for the player application
- **CloudFront**: CDN for global content delivery
- **IVS Channels**: 10 channels for simultaneous multi-angle streaming
  - Channel 1: Main angle (high quality)
  - Channels 2-10: Sub angles (optimized for bandwidth)

## Prerequisites

- AWS CLI v2 configured with appropriate credentials
- Permissions for CloudFormation, S3, CloudFront, and IVS

## Deployment

### Option 1: Using the deployment script (Recommended)

```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Using AWS CLI directly

```bash
aws cloudformation create-stack \
  --stack-name ivs-multi-angle-player-dev \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=ivs-multi-angle-player \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=NumberOfStreams,ParameterValue=10 \
    ParameterKey=IVSChannelType,ParameterValue=STANDARD \
    ParameterKey=IVSLatencyMode,ParameterValue=LOW \
  --region us-west-2
```

## Parameters

| Parameter | Description | Default | Options |
|-----------|-------------|---------|---------|
| ProjectName | Project identifier | ivs-multi-angle-player | Any string |
| Environment | Environment name | dev | dev, staging, prod |
| NumberOfStreams | Number of IVS channels | 10 | 1-10 |
| IVSChannelType | IVS channel quality tier | STANDARD | STANDARD, BASIC |
| IVSLatencyMode | Streaming latency mode | LOW | LOW, NORMAL |

## Support

For issues or questions, see the main [README](../README.md) or open an issue.
