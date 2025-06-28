/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const settings = await (prisma as any).userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    return NextResponse.json({});
  }

  // Serialize Decimal fields to plain numbers for JSON response
  const safeSettings = {
    ...settings,
    noveltyThreshold: (settings as any).noveltyThreshold?.toNumber?.() ?? settings.noveltyThreshold,
  };

  return NextResponse.json(safeSettings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const data: any = {
    lookAheadDays: body.lookAheadDays,
    noveltyThreshold: body.noveltyThreshold,
    autoBlacklist: body.autoBlacklist,
    blacklist: body.blacklist,
    whitelist: body.whitelist,
  };
  // Remove undefined keys
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

  const settings = await (prisma as any).userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });
  return NextResponse.json(settings);
}
