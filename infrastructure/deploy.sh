#!/bin/bash

# Multi-Angle IVS Player - CloudFormation Deployment Script
# このスクリプトは、CloudFormationスタックをデプロイし、必要な情報を出力します。

set -e

# デフォルト値
STACK_NAME="ivs-multi-angle-player-dev"
REGION="us-west-2"
PROJECT_NAME="ivs-multi-angle-player"
ENVIRONMENT="dev"
NUMBER_OF_STREAMS=10
IVS_CHANNEL_TYPE="STANDARD"
IVS_LATENCY_MODE="LOW"

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプメッセージ
usage() {
    cat << USAGE
Usage: $0 [OPTIONS]

マルチアングルIVSプレイヤーのインフラをデプロイします。

OPTIONS:
    -s, --stack-name NAME       CloudFormationスタック名 (default: ${STACK_NAME})
    -r, --region REGION         AWSリージョン (default: ${REGION})
    -p, --project-name NAME     プロジェクト名 (default: ${PROJECT_NAME})
    -e, --environment ENV       環境名 [dev|staging|prod] (default: ${ENVIRONMENT})
    -n, --num-streams NUM       ストリーム数 [1-10] (default: ${NUMBER_OF_STREAMS})
    -t, --channel-type TYPE     IVSチャンネルタイプ [STANDARD|BASIC] (default: ${IVS_CHANNEL_TYPE})
    -l, --latency-mode MODE     レイテンシモード [LOW|NORMAL] (default: ${IVS_LATENCY_MODE})
    -h, --help                  このヘルプメッセージを表示

EXAMPLES:
    # デフォルト設定でデプロイ
    $0

    # カスタム設定でデプロイ
    $0 -s my-ivs-stack -e prod -n 8 -t BASIC

    # 別リージョンにデプロイ
    $0 -r us-east-1
USAGE
    exit 1
}

# パラメータパース
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--project-name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--num-streams)
            NUMBER_OF_STREAMS="$2"
            shift 2
            ;;
        -t|--channel-type)
            IVS_CHANNEL_TYPE="$2"
            shift 2
            ;;
        -l|--latency-mode)
            IVS_LATENCY_MODE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Multi-Angle IVS Player Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Stack Name:       ${GREEN}${STACK_NAME}${NC}"
echo -e "Region:           ${GREEN}${REGION}${NC}"
echo -e "Project Name:     ${GREEN}${PROJECT_NAME}${NC}"
echo -e "Environment:      ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Number of Streams:${GREEN}${NUMBER_OF_STREAMS}${NC}"
echo -e "Channel Type:     ${GREEN}${IVS_CHANNEL_TYPE}${NC}"
echo -e "Latency Mode:     ${GREEN}${IVS_LATENCY_MODE}${NC}"
echo ""

# 確認
read -p "上記の設定でデプロイしますか? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}デプロイをキャンセルしました。${NC}"
    exit 0
fi

# CloudFormationスタックの存在確認
echo -e "\n${BLUE}スタックの存在確認中...${NC}"
if aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" &> /dev/null; then
    echo -e "${YELLOW}スタック '${STACK_NAME}' は既に存在します。${NC}"
    read -p "スタックを更新しますか? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ACTION="update-stack"
        echo -e "${BLUE}スタックを更新します...${NC}"
    else
        echo -e "${YELLOW}デプロイをキャンセルしました。${NC}"
        exit 0
    fi
else
    ACTION="create-stack"
    echo -e "${BLUE}新しいスタックを作成します...${NC}"
fi

# CloudFormationスタックのデプロイ
echo -e "\n${BLUE}CloudFormationスタックをデプロイ中...${NC}"

aws cloudformation ${ACTION} \
    --stack-name "${STACK_NAME}" \
    --template-body file://cloudformation-template.yaml \
    --parameters \
        ParameterKey=ProjectName,ParameterValue="${PROJECT_NAME}" \
        ParameterKey=Environment,ParameterValue="${ENVIRONMENT}" \
        ParameterKey=NumberOfStreams,ParameterValue="${NUMBER_OF_STREAMS}" \
        ParameterKey=IVSChannelType,ParameterValue="${IVS_CHANNEL_TYPE}" \
        ParameterKey=IVSLatencyMode,ParameterValue="${IVS_LATENCY_MODE}" \
    --region "${REGION}"

# デプロイ完了を待つ
echo -e "${BLUE}デプロイ完了を待っています...${NC}"
if [[ "${ACTION}" == "create-stack" ]]; then
    aws cloudformation wait stack-create-complete \
        --stack-name "${STACK_NAME}" \
        --region "${REGION}"
else
    aws cloudformation wait stack-update-complete \
        --stack-name "${STACK_NAME}" \
        --region "${REGION}"
fi

echo -e "${GREEN}✓ デプロイが完了しました！${NC}"

# 出力情報の取得
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}デプロイ情報${NC}"
echo -e "${BLUE}=====================================${NC}"

# CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionURL`].OutputValue' \
    --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

echo -e "\n${GREEN}■ Webアプリケーション${NC}"
echo -e "  CloudFront URL: ${CLOUDFRONT_URL}"
echo -e "  S3 Bucket:      ${BUCKET_NAME}"

echo -e "\n${GREEN}■ IVSチャンネル情報${NC}"

# 各チャンネルの情報を取得
for i in $(seq 1 ${NUMBER_OF_STREAMS}); do
    PLAYBACK_URL=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --region "${REGION}" \
        --query "Stacks[0].Outputs[?OutputKey=='IVSChannel${i}PlaybackURL'].OutputValue" \
        --output text 2>/dev/null || echo "N/A")
    
    if [[ "${PLAYBACK_URL}" != "N/A" ]]; then
        INGEST_ENDPOINT=$(aws cloudformation describe-stacks \
            --stack-name "${STACK_NAME}" \
            --region "${REGION}" \
            --query "Stacks[0].Outputs[?OutputKey=='IVSChannel${i}IngestEndpoint'].OutputValue" \
            --output text 2>/dev/null || echo "N/A")
        
        STREAM_KEY=$(aws cloudformation describe-stacks \
            --stack-name "${STACK_NAME}" \
            --region "${REGION}" \
            --query "Stacks[0].Outputs[?OutputKey=='IVSChannel${i}StreamKey'].OutputValue" \
            --output text 2>/dev/null || echo "N/A")
        
        if [[ $i -eq 1 ]]; then
            echo -e "\n  ${YELLOW}Channel ${i} (Main)${NC}"
        else
            echo -e "\n  ${YELLOW}Channel ${i} (Sub)${NC}"
        fi
        echo -e "    Playback URL:    ${PLAYBACK_URL}"
        echo -e "    Ingest Endpoint: ${INGEST_ENDPOINT}"
        echo -e "    Stream Key:      ${STREAM_KEY}"
    fi
done

# 次のステップ
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}次のステップ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "
1. Webアプリケーションをビルド & デプロイ:
   ${GREEN}cd ../${NC}
   ${GREEN}npm install${NC}
   ${GREEN}npm run build${NC}
   ${GREEN}aws s3 sync ./dist s3://${BUCKET_NAME}/${NC}

2. 配信を開始 (OBS Studioなど):
   - サーバー: rtmps://<Ingest Endpoint>/app/
   - ストリームキー: <Stream Key>

3. Webアプリケーションにアクセス:
   ${CLOUDFRONT_URL}

4. スタック情報の再確認:
   ${GREEN}aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION}${NC}
"

echo -e "${GREEN}✓ 全ての準備が完了しました！${NC}\n"
