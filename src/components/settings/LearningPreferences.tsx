import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Settings, Wifi, WifiOff } from 'lucide-react';
import { downloadProfileJson, importProfileJson } from '../../utils/exportProfile';
import { useLearningStyleStore, preferredFormatLabel } from '../../store/learningStyleStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { joinClassLeaderboard, getStudentSessionId } from '../../services/api';
import { useEnglishStore } from '../../store/englishStore';
import { useMathGamificationStore } from '../../store/mathGamificationStore';
import ConfirmModal from '../ConfirmModal';

const LearningPreferences: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [classCode, setClassCode] = useState(
    () => localStorage.getItem('giasu-class-code') || ''
  );
  const [displayName, setDisplayName] = useState(
    () => useOnboardingStore.getState().name || 'Học sinh'
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const { dataSaver, setDataSaver, preferredFormat } = useLearningStyleStore();
  const { name } = useOnboardingStore();
  const { xp } = useEnglishStore();
  const { points } = useMathGamificationStore();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowImportModal(true);
  };

  const confirmImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      await importProfileJson(file);
      toast.success('Đã nhập hồ sơ! Tải lại trang để áp dụng.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi nhập hồ sơ');
    } finally {
      setShowImportModal(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast.error('Nhập mã lớp 6 ký tự');
      return;
    }
    try {
      await joinClassLeaderboard({
        classCode: classCode.trim(),
        displayName: displayName || name || 'Học sinh',
        xp,
        mathPoints: points,
      });
      localStorage.setItem('giasu-class-code', classCode.trim().toUpperCase());
      toast.success('Đã tham gia bảng xếp hạng lớp!');
    } catch {
      toast.error('Không tham gia được — thử lại sau');
    }
  };

  return (
    <>
      <div className="card p-6 space-y-6">
      <h3 className="font-bold flex items-center gap-2">
        <Settings className="w-5 h-5" /> Cài đặt học tập
      </h3>

      {preferredFormat && (
        <p className="text-sm text-brand-600 dark:text-brand-400">
          Em học tốt hơn khi <strong>{preferredFormatLabel(preferredFormat)}</strong>
        </p>
      )}

      <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
        <div className="flex items-center gap-3">
          {dataSaver ? <WifiOff className="w-5 h-5 text-amber-500" /> : <Wifi className="w-5 h-5 text-emerald-500" />}
          <div>
            <p className="font-semibold text-sm">Chế độ tiết kiệm data</p>
            <p className="text-xs text-slate-500">Nén ảnh, không auto-load Desmos, lời giải ngắn hơn</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={dataSaver}
          onChange={(e) => setDataSaver(e.target.checked)}
          className="w-5 h-5 accent-brand-600"
        />
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={downloadProfileJson}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm"
        >
          <Download className="w-4 h-4" /> Xuất hồ sơ
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm"
        >
          <Upload className="w-4 h-4" /> Nhập hồ sơ
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold mb-3">Bảng xếp hạng lớp (tùy chọn)</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Mã lớp (6 ký tự)"
            className="input-field flex-1"
            maxLength={6}
          />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tên hiển thị"
            className="input-field flex-1"
          />
          <button type="button" onClick={handleJoinClass} className="btn-primary px-4 py-2 text-sm">
            Tham gia
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Session: {getStudentSessionId().slice(0, 8)}...</p>
      </div>
    </div>

    <ConfirmModal
      open={showImportModal}
      title="Nhập hồ sơ"
      message="Nhập hồ sơ sẽ ghi đè dữ liệu hiện tại trên thiết bị này. Em chắc chứ?"
      confirmLabel="Nhập hồ sơ"
      cancelLabel="Hủy bỏ"
      variant="danger"
      onConfirm={confirmImport}
      onCancel={() => {
        setShowImportModal(false);
        if (fileRef.current) fileRef.current.value = '';
      }}
    />
    </>
  );
};

export default LearningPreferences;
