/**
 * Xuất / nhập hồ sơ học sinh — không chứa API keys
 */

const EXPORT_KEYS = [
  'giasu-onboarding',
  'learning-grade',
  'math-history',
  'math-dashboard',
  'english',
  'giasu-daily-plan',
  'giasu-math-gamification',
  'giasu-vocab-srs',
  'giasu-learning-style',
  'mathmaster-student-session',
  'giasu-tutor-mode',
  'giasu-practice-session',
  'giasu-class-code',
];

export interface ProfileExport {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportProfile(): ProfileExport {
  const data: Record<string, unknown> = {};
  for (const key of EXPORT_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadProfileJson() {
  const payload = exportProfile();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `giasu-profile-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Merge an toàn — ghi đè localStorage keys có trong file */
export function importProfileJson(file: File): Promise<ProfileExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as ProfileExport;
        if (!parsed.data || parsed.version !== 1) {
          reject(new Error('File không hợp lệ'));
          return;
        }
        for (const [key, value] of Object.entries(parsed.data)) {
          if (!EXPORT_KEYS.includes(key)) continue;
          localStorage.setItem(
            key,
            typeof value === 'string' ? value : JSON.stringify(value)
          );
        }
        resolve(parsed);
      } catch {
        reject(new Error('Không đọc được file JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsText(file);
  });
}
