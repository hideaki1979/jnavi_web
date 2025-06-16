import { cancelSpeech, getJapaneseVoices, getSpeechSynthesisState, pauseSpeech, resumeSpeech, speakText } from "@/lib/speech-synthesis";
import { useCallback, useEffect, useState } from "react";

interface UseSpeechSynthesisOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    autoDetectLanguage?: boolean;
}

interface UseSpeechSynthesisReturn {
    speak: (text: string) => Promise<void>;
    cancel: () => void;
    pause: () => void;
    resume: () => void;
    isSpeaking: boolean;
    isPaused: boolean;
    isSupported: boolean;
    isLoading: boolean;
    error: string | null;
    availableVoices: SpeechSynthesisVoice[];
    setVoice: (voice: SpeechSynthesisVoice | null) => void;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

    // 初期化とサポート状況の確認
    useEffect(() => {
        const loadVoices = async () => {
            try {
                setIsLoading(true)
                const state = getSpeechSynthesisState()
                setIsSupported(state.isSupported)

                if (state.isSupported) {
                    // 日本語音声を取得
                    const japaneseVoices = await getJapaneseVoices()
                    setAvailableVoices(japaneseVoices)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '音声合成時にエラーが発生')
            } finally {
                setIsLoading(false)
            }
        }
        loadVoices()
    }, [])

    useEffect(() => {
        if (availableVoices.length > 0 && !selectedVoice) {
            setSelectedVoice(availableVoices[0])
        }
    }, [availableVoices, selectedVoice])

    // 注意: 状態監視はイベント駆動（speak関数内のコールバック）で行います
    // ポーリング処理は不要です

    const speak = useCallback(async (text: string) => {
        if (!isSupported) {
            throw new Error('音声合成APIがサポート対象外です')
        }

        if (!text || text.trim().length === 0) {
            throw new Error('音声合成する文字列がありません')
        }

        setError(null)

        try {
            await speakText({
                text,
                rate: options.rate || 0.8,
                pitch: options.pitch || 1.0,
                volume: options.volume || 1.0,
                voice: options.voice || selectedVoice || undefined,
                onStart: () => {
                    setIsSpeaking(true)
                    setIsPaused(false)
                },
                onEnd: () => {
                    setIsSpeaking(false)
                    setIsPaused(false)
                },
                onError: (error) => {
                    setError(error?.message || '音声合成エラー発生');
                    setIsSpeaking(false);
                    setIsPaused(false);
                },
                onPause: () => {
                    setIsPaused(true)
                },
                onResume: () => {
                    setIsPaused(false);
                }
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'start speech synthesisに失敗';
            setError(errorMessage);
            throw new Error(errorMessage)
        }

    }, [isSupported, options, selectedVoice])

    const cancel = useCallback(() => {
        if (!isSupported) return

        cancelSpeech()
        setIsSpeaking(false)
        setIsPaused(false)
        setError(null)
    }, [isSupported])

    const pause = useCallback(() => {
        if (!isSupported || !isSpeaking) return

        pauseSpeech()
        setIsPaused(true)
    }, [isSupported, isSpeaking])

    const resume = useCallback(() => {
        if (!isSupported || !isPaused) return

        resumeSpeech()
        setIsPaused(false)
    }, [isSupported, isPaused])

    const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
        setSelectedVoice(voice)
    }, [])

    return {
        speak,
        cancel,
        pause,
        resume,
        isSpeaking,
        isPaused,
        isSupported,
        isLoading,
        error,
        availableVoices,
        setVoice,
    }
}