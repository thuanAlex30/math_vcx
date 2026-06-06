import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { scorePronunciation } from '../../services/englishApi';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import { useEnglishStore } from '../../store/englishStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';

interface SentenceItem {
  id: string;
  text: string;
  ipa?: string;
  meaning: string;
}

interface ScoreResult {
  score: number;
  feedback: string;
  issues?: string[];
}

const SAMPLE_SENTENCES: SentenceItem[] = [
  { id: 's1', text: 'The conference addressed sustainable development and global inequality.', ipa: '/ðə ˈkɒnfərəns əˈdrɛst səˈsteɪnəbl dɪˈveləpmənt ænd ˈɡloʊbəl ˌɪnɪˈkwɒləti/', meaning: 'Hội nghị đã thảo luận về phát triển bền vững và bất bình đẳng toàn cầu.' },
  { id: 's2', text: 'Scholars have debated whether artificial intelligence poses existential risks.', ipa: '/ˈskɒləz hæv dɪˈbeɪtɪd ˈweðər ˌɑːrtɪˈfɪʃəl ɪnˈtelɪdʒəns ˈpoʊzɪz ˌeɡzɪˈstenʃəl rɪsks/', meaning: 'Các học giả đã tranh luận về việc trí tuệ nhân tạo có gây ra rủi ro hiện sinh hay không.' },
  { id: 's3', text: 'I would like to apply for a scholarship to study abroad next year.', ipa: '/aɪ wʊd laɪk tu əˈplaɪ fɔːr ə ˈskɒlərʃɪp tu ˈstʌdi əˈbrɔːd nekst jɪər/', meaning: 'Tôi muốn xin học bổng để du học nước ngoài vào năm sau.' },
  { id: 's4', text: 'Although the research was challenging, we achieved remarkable results.', ipa: '/ɔːlˈðoʊ ðə rɪˈsɜːrtʃ wɒz ˈtʃælɪndʒɪŋ wi əˈtʃiːvd rɪˈmɑːrkəbəl rɪˈzʌlts/', meaning: 'Mặc dù nghiên cứu khó khăn, chúng tôi đã đạt được kết quả đáng chú ý.' },
];

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

const SpeakingPracticeModule: React.FC = () => {
  const { grade } = useGradeStore();
  const { addXp, updateScores } = useEnglishStore();
  const [sentences] = useState<SentenceItem[]>(SAMPLE_SENTENCES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [attempts, setAttempts] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          final += event.results[i][0].transcript;
        }
        setTranscript(final);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('[speaking] recognition error:', event.error);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported || !recognitionRef.current) return;
    setTranscript('');
    setResult(null);
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('[speaking] start error:', e);
      setIsRecording(false);
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const gradeAttempt = useCallback(async () => {
    const current = sentences[activeIndex];
    if (!transcript.trim()) return;

    setLoading(true);
    try {
      const res = await scorePronunciation(current.text, transcript, grade as Grade, 'intermediate');
      const scoreResult: ScoreResult = {
        score: res.score ?? 0,
        feedback: res.feedback ?? '',
        issues: res.tips ?? [],
      };
      setResult(scoreResult);
      setAttempts((a) => a + 1);

      if (scoreResult.score >= 80) {
        addXp(15);
        updateScores({ pronunciation: scoreResult.score });
      }

      if (!bestScore || scoreResult.score > bestScore) {
        setBestScore(scoreResult.score);
      }
    } catch {
      setResult({ score: 0, feedback: 'Không thể chấm phát âm. Thử lại nhé!', issues: [] });
    } finally {
      setLoading(false);
    }
  }, [transcript, sentences, activeIndex, grade, addXp, updateScores, bestScore]);

  const nextSentence = useCallback(() => {
    setActiveIndex((i) => (i + 1) % sentences.length);
    setTranscript('');
    setResult(null);
    setAttempts(0);
    setBestScore(null);
  }, [sentences.length]);

  const current = sentences[activeIndex];

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
    return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto px-1">
      <div className="text-center space-y-1">
        <h2 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">
          Luyện phát âm
        </h2>
        <p className="text-xs text-slate-500">Lớp {grade} · Nghe + Nói + Chấm điểm</p>
      </div>

      {/* Speed control */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-slate-500">Tốc độ TTS:</span>
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              speed === s
                ? 'bg-brand-100 dark:bg-brand-900/30 border-brand-400 text-brand-700 dark:text-brand-300 font-semibold'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-300'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Sentence card */}
      <div className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
              {current?.text}
            </p>
            {current?.ipa && (
              <p className="text-xs text-slate-400 mt-1 font-mono break-all">
                {current.ipa}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1 italic">
              {current?.meaning}
            </p>
          </div>
          <EnglishAudioPlayer text={current?.text || ''} compact speed={speed} />
        </div>

        {/* Transcript display */}
        <div className={`p-3 rounded-xl border text-sm min-h-[44px] flex items-center gap-2 ${
          transcript ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
        }`}>
          {transcript ? (
            <span className="text-slate-700 dark:text-slate-200">{transcript}</span>
          ) : (
            <span className="text-slate-400 italic text-xs">Nhấn microphone để nói...</span>
          )}
        </div>

        {/* Score result */}
        {result && (
          <div className={`p-4 rounded-xl border space-y-3 ${scoreBg(result.score)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.score >= 80 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-bold text-lg">
                  <span className={scoreColor(result.score)}>{result.score}</span>
                  <span className="text-slate-400 text-sm font-normal">/100</span>
                </span>
              </div>
              {attempts > 1 && bestScore !== null && (
                <span className="text-xs text-slate-500">
                  Lần tốt nhất: <span className="font-semibold text-emerald-600">{bestScore}</span>
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {result.feedback}
            </p>

            {result.issues && result.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Gợi ý cải thiện:
                </p>
                {result.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {issue}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!result ? (
            <>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading || !isSupported}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                {isRecording ? 'Dừng' : transcript ? 'Ghi âm lại' : 'Bắt đầu nói'}
              </button>

              {transcript && (
                <button
                  type="button"
                  onClick={gradeAttempt}
                  disabled={loading}
                  className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Chấm điểm'}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={nextSentence}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-lg shadow-brand-500/30 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Câu tiếp theo
            </button>
          )}
        </div>

        {!isSupported && (
          <p className="text-xs text-center text-amber-600 dark:text-amber-400">
            Trình duyệt chưa hỗ trợ nhận diện giọng nói. Dùng Chrome/Edge để có trải nghiệm tốt nhất.
          </p>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {sentences.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                setTranscript('');
                setResult(null);
                setAttempts(0);
                setBestScore(null);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIndex
                  ? 'bg-brand-500 w-4'
                  : i < activeIndex
                  ? 'bg-emerald-400'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeakingPracticeModule;
