# マルチアングルWeb配信システム設計書

## 1. システム概要

### 1.1 目的
Amazon IVS (Interactive Video Service) を使用して、10ストリームの同時マルチアングル配信を実現するWebアプリケーションを構築する。

### 1.2 主要要件
- **ストリーム数**: 10本の同時配信
- **画質最適化**: メインストリーム以外は低レンディションで配信し、トラフィック・負荷を削減
- **ホスティング**: S3 + CloudFront による静的サイトホスティング
- **低レイテンシ**: IVS Low-Latency Streaming による低遅延配信

---

## 2. システムアーキテクチャ

### 2.1 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                         視聴者                               │
│                    (Web Browser)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront                                │
│              (CDN + SSL Termination)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    S3 Bucket                                 │
│          (静的コンテンツホスティング)                         │
│   - index.html                                              │
│   - multi-angle-player.js                                   │
│   - amazon-ivs-player SDK                                   │
│   - CSS, Assets                                             │
└─────────────────────────────────────────────────────────────┘

                         ↓ (10 Stream URLs)

┌─────────────────────────────────────────────────────────────┐
│              Amazon IVS Low-Latency Channels                │
│                                                              │
│  Channel 1 (Main)    : 1080p @ 30fps, 4.5Mbps              │
│  Channel 2-10 (Subs) : 480p @ 15fps, 1.0Mbps each          │
│                                                              │
│  Total: ~13.5Mbps per viewer                                │
└─────────────────────────────────────────────────────────────┘
                         ↑
                         │ RTMPS
┌─────────────────────────────────────────────────────────────┐
│                   配信デバイス                               │
│           (10台のカメラ/エンコーダー)                        │
│    - OBS Studio / FFmpeg / Hardware Encoders                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

1. **配信フロー**
   - 各カメラデバイス → IVS Ingest Endpoint (RTMPS)
   - IVS → 自動トランスコーディング → HLS/DASH出力
   - IVS → CloudFront CDN 経由で配信

2. **視聴フロー**
   - ユーザー → CloudFront → S3からHTMLアプリケーション取得
   - JavaScript実行 → 10個のIVS Player インスタンス作成
   - 各Player → IVS Playback URLからストリーミング受信

---

## 3. AWS構成詳細

### 3.1 Amazon IVS設定

#### 3.1.1 IVSチャンネル構成

| チャンネル | 用途 | 解像度 | フレームレート | ビットレート | オーディオ |
|-----------|------|--------|--------------|------------|-----------|
| Channel-1 | メインアングル | 1920x1080 | 30fps | 4.5Mbps | 128kbps AAC |
| Channel-2 | サブアングル1 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-3 | サブアングル2 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-4 | サブアングル3 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-5 | サブアングル4 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-6 | サブアングル5 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-7 | サブアングル6 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-8 | サブアングル7 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-9 | サブアングル8 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |
| Channel-10 | サブアングル9 | 854x480 | 15fps | 1.0Mbps | 96kbps AAC |

**合計帯域幅**: 約13.5Mbps/視聴者

#### 3.1.2 IVSチャンネル設定

```typescript
// IVS Channel Configuration (CDK Example)
{
  type: "STANDARD", // or "BASIC"
  latencyMode: "LOW", // 低遅延モード
  authorized: false, // 認証不要（パブリック配信）
  recordingConfiguration: {
    enabled: false // 録画は今回不要
  },
  preset: "HIGHER_BANDWIDTH_DELIVERY" // 高画質配信プリセット
}
```

### 3.2 S3バケット構成

#### 3.2.1 バケット構成

```
s3://ivs-multi-angle-player/
├── index.html
├── js/
│   ├── multi-angle-player.js
│   ├── config.js
│   └── utils.js
├── css/
│   └── styles.css
├── assets/
│   └── (images, icons)
└── libs/
    └── amazon-ivs-player/
        ├── dist/
        │   ├── amazon-ivs-player.min.js
        │   └── assets/
        │       ├── amazon-ivs-wasmworker.min.js
        │       └── amazon-ivs-wasmworker.min.wasm
```

#### 3.2.2 S3バケットポリシー

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ivs-multi-angle-player/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### 3.3 CloudFront設定

#### 3.3.1 ディストリビューション設定

```yaml
CloudFront Distribution:
  Origins:
    - DomainName: ivs-multi-angle-player.s3.amazonaws.com
      OriginAccessControl: OAC (Origin Access Control)
  
  DefaultCacheBehavior:
    ViewerProtocolPolicy: redirect-to-https
    AllowedMethods: [GET, HEAD, OPTIONS]
    CachedMethods: [GET, HEAD]
    CachePolicyId: CachingOptimized
    Compress: true
  
  PriceClass: PriceClass_All
  
  CustomErrorResponses:
    - ErrorCode: 404
      ResponseCode: 200
      ResponsePagePath: /index.html
```

#### 3.3.2 キャッシュ戦略

| リソース | TTL | 戦略 |
|---------|-----|------|
| HTML | 5分 | 短いTTL、頻繁な更新 |
| JavaScript | 1日 | ファイル名にハッシュ使用 |
| CSS | 1日 | ファイル名にハッシュ使用 |
| WASM | 7日 | 変更頻度低い |

---

## 4. フロントエンド実装

### 4.1 技術スタック

- **フレームワーク**: Vanilla JavaScript (or React/Vue.js)
- **IVS SDK**: amazon-ivs-player (v1.x)
- **ビルドツール**: Webpack 5
- **言語**: TypeScript

### 4.2 主要コンポーネント

#### 4.2.1 MultiAnglePlayer クラス

```typescript
interface StreamConfig {
  id: string;
  name: string;
  url: string;
  quality: 'high' | 'low';
  isMain: boolean;
}

class MultiAnglePlayer {
  private players: IVSPlayer[] = [];
  private streams: StreamConfig[];
  private activeMainStream: number = 0;

  constructor(streams: StreamConfig[]) {
    this.streams = streams;
    this.initializePlayers();
  }

  private initializePlayers() {
    this.streams.forEach((stream, index) => {
      const videoElement = document.getElementById(`video-${index}`);
      const player = IVSPlayer.create();
      
      player.attachHTMLVideoElement(videoElement);
      
      // メイン以外は低画質に固定
      if (!stream.isMain) {
        player.setAutoQualityMode(false);
        player.setQuality(this.getLowestQuality(player));
      }
      
      player.setAutoplay(true);
      player.setMuted(index !== this.activeMainStream); // メイン以外はミュート
      player.load(stream.url);
      
      this.players.push(player);
    });
  }

  switchMainStream(index: number) {
    // 現在のメインをミュート
    this.players[this.activeMainStream].setMuted(true);
    
    // 新しいメインをアンミュート & 高画質化
    this.players[index].setMuted(false);
    this.players[index].setAutoQualityMode(true);
    
    this.activeMainStream = index;
  }

  private getLowestQuality(player: IVSPlayer): Quality {
    const qualities = player.getQualities();
    return qualities[qualities.length - 1]; // 最低画質を返す
  }

  dispose() {
    this.players.forEach(player => player.delete());
  }
}
```

#### 4.2.2 ストリーム設定 (config.js)

```javascript
const STREAM_CONFIG = [
  {
    id: 'stream-1',
    name: 'メインアングル',
    url: 'https://XXXXX.cloudfront.net/ivs/v1/XXXXXX/CHANNEL_1/media/hls/master.m3u8',
    quality: 'high',
    isMain: true
  },
  {
    id: 'stream-2',
    name: 'サブアングル1',
    url: 'https://XXXXX.cloudfront.net/ivs/v1/XXXXXX/CHANNEL_2/media/hls/master.m3u8',
    quality: 'low',
    isMain: false
  },
  // ... 残り8ストリーム
];
```

### 4.3 UIレイアウト

```
┌─────────────────────────────────────────────────────────┐
│                   Multi-Angle Player                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              ┌───────────────────────┐                  │
│              │                       │                  │
│              │   メインビュー         │                  │
│              │   (1080p/480p)        │                  │
│              │                       │                  │
│              └───────────────────────┘                  │
│                                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │                  │
│  └────┘ └────┘ └────┘ └────┘ └────┘                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  │ 6  │ │ 7  │ │ 8  │ │ 9  │ │ 10 │                  │
│  └────┘ └────┘ └────┘ └────┘ └────┘                  │
│                                                         │
│             サムネイル (480p/360p)                       │
└─────────────────────────────────────────────────────────┘
```

### 4.4 パフォーマンス最適化

#### 4.4.1 Lazy Loading

```typescript
class LazyStreamLoader {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const videoElement = entry.target as HTMLVideoElement;
            const playerId = videoElement.dataset.playerId;
            this.loadStream(playerId);
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  observe(element: HTMLElement) {
    this.observer.observe(element);
  }
}
```

#### 4.4.2 Resource Hints

```html
<!-- Preconnect to IVS CDN -->
<link rel="preconnect" href="https://YOUR_IVS_DOMAIN.cloudfront.net">
<link rel="dns-prefetch" href="https://YOUR_IVS_DOMAIN.cloudfront.net">
```

---

## 5. デプロイ手順

### 5.1 前提条件

- AWS CLI v2インストール済み
- AWS認証情報設定済み (`aws configure`)
- Node.js 18+ インストール済み
- Terraform または AWS CDK インストール済み

### 5.2 IVSチャンネル作成

#### 5.2.1 AWS CLI での作成

```bash
# 10個のチャンネルを作成
for i in {1..10}; do
  aws ivs create-channel \
    --name "multi-angle-channel-${i}" \
    --latency-mode LOW \
    --type STANDARD \
    --region us-west-2 \
    --output json > channel-${i}.json
done

# Playback URLを抽出
for i in {1..10}; do
  cat channel-${i}.json | jq -r '.channel.playbackUrl'
done
```

#### 5.2.2 Ingest情報の取得

```bash
# Stream Key取得
for i in {1..10}; do
  cat channel-${i}.json | jq -r '.streamKey.value'
done
```

### 5.3 S3バケット作成

```bash
# バケット作成
aws s3 mb s3://ivs-multi-angle-player-$(date +%s) --region us-west-2

# バケット名を変数に保存
BUCKET_NAME="ivs-multi-angle-player-$(date +%s)"
```

### 5.4 CloudFront設定

```bash
# Origin Access Control作成
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
  "Name=ivs-player-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3"

# Distribution作成 (設定ファイルを使用)
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### 5.5 アプリケーションビルド & デプロイ

```bash
# 依存関係インストール
npm install

# ビルド
npm run build

# S3にアップロード
aws s3 sync ./dist s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json"

# HTMLは短いキャッシュ
aws s3 cp ./dist/index.html s3://${BUCKET_NAME}/index.html \
  --cache-control "public, max-age=300"

# CloudFront キャッシュクリア
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

---

## 6. コスト試算

### 6.1 月間コスト試算

前提条件：
- 視聴者数: 100人同時接続
- 配信時間: 1日3時間、月20日 = 60時間/月
- 視聴者あたり帯域: 13.5Mbps

#### 6.1.1 IVS コスト

```
入力 (Input):
- 10チャンネル × 60時間 = 600時間
- $2.00/hour × 600時間 = $1,200

出力 (Output / Standard Delivery):
- 100視聴者 × 13.5Mbps × 60時間 = 29,160GB
- 最初10TB: $0.085/GB × 10,000GB = $850
- 残り19TB: $0.080/GB × 19,160GB = $1,533
- Output合計: $2,383

IVS 合計: $3,583/月
```

#### 6.1.2 CloudFront コスト

```
データ転送:
- HTMLアプリケーション配信: ~10MB × 100視聴者 = 1GB
- $0.085/GB × 1GB = $0.09

CloudFront 合計: ~$1/月
```

#### 6.1.3 S3 コスト

```
ストレージ: ~100MB = $0.01
リクエスト: 100視聴者 × 20回 = 2,000回 = $0.01

S3 合計: ~$0.02/月
```

#### 6.1.4 総コスト

| サービス | 月額コスト |
|---------|-----------|
| IVS | $3,583 |
| CloudFront | $1 |
| S3 | $0.02 |
| **合計** | **$3,584** |

**注意**: 
- IVSのコストが支配的
- 視聴者数や配信時間に応じてスケール
- 録画機能を有効化すると追加コストが発生

### 6.2 コスト最適化案

1. **IVS Basic チャンネル使用**: 
   - $1.40/hour (Standard比で30%削減)
   - ただし、画質制限あり

2. **配信時間の最適化**:
   - 非ピーク時のみ配信

3. **ストリーム数削減**:
   - 必要に応じて6-7ストリームに削減

---

## 7. セキュリティ考慮事項

### 7.1 認証・認可

- **オプション1**: パブリック配信（認証なし）
- **オプション2**: IVS Private Channelを使用
  ```javascript
  player.load(playbackUrl, {
    token: 'SIGNED_JWT_TOKEN'
  });
  ```

### 7.2 DDoS対策

- CloudFront + AWS Shield Standard (無料)
- AWS WAF でレート制限設定

### 7.3 CORS設定

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

---

## 8. モニタリング & ロギング

### 8.1 CloudWatch メトリクス

- IVS:
  - ConcurrentViews (同時視聴者数)
  - IngestFramerate
  - IngestBitrate
  - RecordedTime

- CloudFront:
  - Requests
  - BytesDownloaded
  - 4xxErrorRate / 5xxErrorRate

### 8.2 アラート設定

```yaml
Alarms:
  - Name: IVS-High-ConcurrentViews
    Metric: ConcurrentViews
    Threshold: 1000
    Action: SNS通知

  - Name: IVS-Stream-Disconnected
    Metric: StreamState
    Threshold: OFFLINE
    Action: SNS通知 + Lambda自動復旧
```

---

## 9. トラブルシューティング

### 9.1 よくある問題

| 問題 | 原因 | 解決策 |
|-----|------|--------|
| プレイヤーが読み込めない | CORS設定 | S3/CloudFront CORS設定確認 |
| WASMエラー | WASMファイルが見つからない | パス設定確認 |
| 音声が出ない | 自動再生ポリシー | ユーザーインタラクション後に unmute |
| カクカクする | 帯域不足 | 低画質レンディション使用 |

---

## 10. 次のステップ

### 10.1 実装フェーズ

1. ✅ 設計書作成
2. ⏳ GitHubリポジトリ準備
3. ⏳ フロントエンド実装
4. ⏳ IaCでインフラ構築 (Terraform/CDK)
5. ⏳ デプロイ & テスト
6. ⏳ パフォーマンス最適化

### 10.2 将来の拡張機能

- チャット機能統合 (IVS Chat)
- 録画・アーカイブ機能
- リアルタイム統計ダッシュボード
- モバイルアプリ対応
- マルチリージョン展開

---

## 11. 参考資料

- [Amazon IVS Documentation](https://docs.aws.amazon.com/ivs/)
- [IVS Player Web SDK](https://aws.github.io/amazon-ivs-web-broadcast/docs/sdk-reference)
- [IVS Pricing](https://aws.amazon.com/ivs/pricing/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

**作成日**: 2025-12-23  
**バージョン**: 1.0  
**ステータス**: Ready for Implementation
