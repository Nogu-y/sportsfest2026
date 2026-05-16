import { createHash } from 'node:crypto'
import { OpenAPIHono } from '@hono/zod-openapi'
import { getPublicMasterDoc } from '../../schemas/public/master'
import { getMasterData } from '../../repositories/public/master'

// キャッシュ制御用のETag生成関数
const createEtag = (value: string) => {
    return `"${createHash('sha1').update(value).digest('hex')}"`
}

// クライアントから送られた If-None-Match との照合関数
const hasMatchingEtag = (value: string | undefined, etag: string) => {
    if (!value) return false
    return value
        .split(',')
        .map((tag) => tag.trim())
        .includes(etag)
}

export const publicMasterRoutes = new OpenAPIHono()
    .openapi(getPublicMasterDoc,
        async (c) => {
        try {
            // リポジトリ層からマスタデータ全体を取得
            const data = await getMasterData()

            // ペイロード全体のハッシュからETagを生成
            const body = JSON.stringify(data)
            const etag = createEtag(body)

            // キャッシュ制御ヘッダを付与
            c.header('Cache-Control', 'public, must-revalidate')
            c.header('ETag', etag)

            // クライアント側の保持データに変更がない場合は304を返して通信量削減
            if (hasMatchingEtag(c.req.header('if-none-match'), etag)) {
                return c.body(null, 304)
            }

            // データの返却（スキーマ定義に準拠したオブジェクト全体）
            return c.json(data, 200)
        } catch {
            return c.json({ message: 'failed to fetch' }, 500)
        }
    })