import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/** Turns draft mode back off and returns to the requested path (defaults to home). */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('path')
  const path = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  const dm = await draftMode()
  dm.disable()
  redirect(path)
}
