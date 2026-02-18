import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SnapshotData } from '@/lib/types';
import { format } from 'date-fns';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'sample-snapshot.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data: SnapshotData = JSON.parse(fileContents);

    let markdown = `# MENA Force Posture Daily Brief\n`;
    markdown += `**Date:** ${format(new Date(), 'yyyy-MM-dd')}\n`;
    markdown += `**Generated:** ${data.generatedAtUtc}\n\n`;

    markdown += `## Executive Summary\n`;
    markdown += `Monitoring ${data.items.length} active developments across the region.\n\n`;

    const categories = Array.from(new Set(data.items.map(i => i.category)));

    categories.forEach(cat => {
      markdown += `### ${cat.replace('_', ' ')}\n`;
      const items = data.items.filter(i => i.category === cat);
      items.forEach(item => {
        markdown += `- **${item.title}** (${item.location?.name || 'Unknown Location'}): ${item.summary}\n`;
      });
      markdown += `\n`;
    });

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
