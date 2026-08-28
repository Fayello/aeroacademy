#!/usr/bin/env python3
"""Generate seed-enrich-courses-new.ts"""
import sys, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed-enrich-courses-new.ts')

def write_file(content):
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {len(content)} chars to {OUTPUT}")

# Read the current file approach: we build in memory
B = []
def a(s):
    B.append(s)

HEADER = """import { PrismaClient } from '@prisma/client';
import { createCourseWithQuizzes } from './seed-enrich-helpers';

export async function seedEnrichCoursesNew(prisma: PrismaClient) {
  console.log('Seeding 10 new enriched courses...');
"""

FOOTER = """
  console.log('All 10 courses seeded successfully!');
}
"""

a(HEADER)
# Courses will be appended by separate scripts
a(FOOTER)

write_file(''.join(B))
