import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isSimulation = searchParams.get('isSimulation') !== 'false'; // default to simulation

    const db = getAdminDb(isSimulation);

    const snapshot = await db.collection('requests').where('status', '==', 'pending').get();

    const requests: any[] = [];
    snapshot.forEach((doc: any) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ success: true, requests }, { status: 200 });
  } catch (error: any) {
    console.error('Error listing requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
