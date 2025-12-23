# Infrastructure Deployment Guide

このディレクトリには、マルチアングルIVSプレイヤーのAWSインフラストラクチャをデプロイするためのCloudFormationテンプレートが含まれています。

## 📋 前提条件

- AWS CLI v2がインストール済み
- AWS認証情報が設定済み (`aws configure`)
- 適切なIAM権限（S3, CloudFront, IVS, IAM権限）

## 🚀 クイックスタート

### 1. スタックのデプロイ

```bash
# デフォルト設定でデプロイ（10ストリーム、dev環境）
aws cloudformation create-stack \
  --stack-name ivs-multi-angle-player-dev \
  --template-body file://cloudformation-template.yaml \
  --region us-west-2

# パラメータをカスタマイズしてデプロイ
aws cloudformation create-stack \
  --stack-name ivs-multi-angle-player-prod \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=my-ivs-player \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=NumberOfStreams,ParameterValue=10 \
    ParameterKey=IVSChannelType,ParameterValue=STANDARD \
    ParameterKey=IVSLatencyMode,ParameterValue=LOW \
  --region us-west-2
```

### 2. デプロイ状態の確認

```bash
aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].StackStatus'
```

### 3. 出力値の取得

```bash
# 全ての出力を表示
aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs'

# CloudFront URLのみ取得
aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionURL`].OutputValue' \
  --output text

# IVSチャンネルのPlayback URLを全て取得
aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?contains(OutputKey, `PlaybackURL`)].{Channel:OutputKey,URL:OutputValue}' \
  --output table
```

## 📊 パラメータ一覧

| パラメータ名 | デフォルト値 | 説明 |
|------------|------------|------|
| ProjectName | ivs-multi-angle-player | プロジェクト名（リソース名に使用） |
| Environment | dev | 環境名（dev/staging/prod） |
| NumberOfStreams | 10 | 作成するIVSチャンネル数（1-10） |
| IVSChannelType | STANDARD | IVSチャンネルタイプ（STANDARD/BASIC） |
| IVSLatencyMode | LOW | レイテンシモード（LOW/NORMAL） |

## 🔧 作成されるリソース

### インフラストラクチャ
- **S3 Bucket**: 静的サイトホスティング用
  - バージョニング有効
  - 暗号化有効（AES256）
  - パブリックアクセスブロック設定済み

- **CloudFront Distribution**: CDN
  - Origin Access Control (OAC) 使用
  - HTTPS強制
  - Gzip圧縮有効
  - カスタムエラーページ設定済み

### IVSチャンネル
- **Channel 1**: メインアングル（1080p推奨）
- **Channel 2-10**: サブアングル（480p推奨）

各チャンネルに対して以下が作成されます：
- IVS Channel
- IVS Stream Key
- 関連するタグ

## 📤 出力（Outputs）

デプロイ完了後、以下の情報が出力されます：

### CloudFront & S3
- `CloudFrontDistributionURL`: Webアプリケーションのアクセス URL
- `CloudFrontDistributionId`: CloudFront Distribution ID
- `WebsiteBucketName`: S3バケット名
- `WebsiteBucketArn`: S3バケットARN

### IVSチャンネル情報（各チャンネル）
- `IVSChannel{N}PlaybackURL`: 視聴用URL（HLS）
- `IVSChannel{N}IngestEndpoint`: 配信用エンドポイント
- `IVSChannel{N}StreamKey`: ストリームキー（機密情報）

## 🎥 配信設定（OBS Studio の例）

CloudFormationから取得した情報を使用して配信設定を行います：

```
サーバー: rtmps://{IngestEndpoint}/app/
ストリームキー: {StreamKey}
```

### 推奨エンコーダー設定

**メインチャンネル（Channel 1）**
- 解像度: 1920x1080
- フレームレート: 30fps
- ビットレート: 4500 kbps
- キーフレーム間隔: 2秒
- エンコーダー: H.264
- オーディオ: AAC 128kbps

**サブチャンネル（Channel 2-10）**
- 解像度: 854x480
- フレームレート: 15fps
- ビットレート: 1000 kbps
- キーフレーム間隔: 2秒
- エンコーダー: H.264
- オーディオ: AAC 96kbps

## 🌐 Webアプリケーションのデプロイ

インフラのデプロイ後、Webアプリケーションをデプロイします：

```bash
# S3バケット名を取得
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text)

# アプリケーションをビルド（別途ディレクトリで実行）
npm run build

# S3にアップロード
aws s3 sync ./dist s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

# HTMLは短いキャッシュ
aws s3 cp ./dist/index.html s3://${BUCKET_NAME}/index.html \
  --cache-control "public, max-age=300"

# CloudFrontキャッシュをクリア
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

## 🔄 スタックの更新

```bash
aws cloudformation update-stack \
  --stack-name ivs-multi-angle-player-dev \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=NumberOfStreams,ParameterValue=8 \
  --region us-west-2
```

## 🗑️ スタックの削除

```bash
# S3バケットを空にする（必須）
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://${BUCKET_NAME} --recursive

# スタック削除
aws cloudformation delete-stack \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2

# 削除完了を待つ
aws cloudformation wait stack-delete-complete \
  --stack-name ivs-multi-angle-player-dev \
  --region us-west-2
```

## 💰 コスト見積もり

### 月間コスト（前提：100視聴者、60時間/月配信）

| サービス | 月額コスト（概算） |
|---------|------------------|
| IVS (10 channels, STANDARD) | $3,583 |
| CloudFront | $1 |
| S3 | $0.02 |
| **合計** | **$3,584** |

**コスト削減オプション：**
- IVS BASIC チャンネル使用: 約30%削減
- ストリーム数を減らす: 6-8チャンネルで使用
- 配信時間を最適化: 必要な時間のみ配信

## 🔐 セキュリティ考慮事項

1. **Stream Keyの管理**
   - Stream Keyは機密情報として扱う
   - AWS Secrets Managerへの保存を推奨
   - 定期的なローテーション

2. **S3バケットポリシー**
   - CloudFrontからのアクセスのみ許可
   - パブリックアクセス完全ブロック

3. **CloudFront**
   - HTTPS強制
   - 必要に応じてAWS WAF設定

## 📚 参考資料

- [AWS IVS Documentation](https://docs.aws.amazon.com/ivs/)
- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [IVS Pricing](https://aws.amazon.com/ivs/pricing/)

## 🐛 トラブルシューティング

### スタック作成に失敗する

**エラー: "Bucket name already exists"**
- S3バケット名が既に使用されている
- `ProjectName` または `Environment` パラメータを変更

**エラー: "IVS service unavailable in region"**
- IVSは全リージョンで利用可能ではない
- 対応リージョン: us-west-2, us-east-1, eu-west-1, ap-northeast-1 など

### CloudFrontへのアクセスが403エラー

- S3バケットポリシーの確認
- CloudFront OACの設定確認
- S3にファイルがアップロードされているか確認

### IVSストリームが表示されない

- 配信が実際に開始されているか確認
- Ingest EndpointとStream Keyが正しいか確認
- IVSチャンネルのステータス確認:
  ```bash
  aws ivs get-channel --arn <channel-arn>
  ```

## 📞 サポート

問題が発生した場合は、以下を確認してください：
- CloudWatch Logs
- CloudFormation Events
- IVS Stream Health

---

**作成日**: 2025-12-23  
**バージョン**: 1.0
