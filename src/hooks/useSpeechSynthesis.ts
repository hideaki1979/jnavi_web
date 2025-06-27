import { cancelSpeech, getJapaneseVoices, pauseSpeech, resumeSpeech, speakText } from "@/lib/speech-synthesis";
import { useCallback, useEffect, useState } from "react";

interface UseSpeechSynthesisOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
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
    isMounted: boolean;
    error: string | null;
    availableVoices: SpeechSynthesisVoice[];
    setVoice: (voice: SpeechSynthesisVoice | null) => void;
}

/**
 * Web Speech APIを使用して、指定されたテキストを音声で読み上げるためのReact Hookを提供します。
 * - 音声合成APIの初期化やサポート状況の確認を行います。
 * - 音声合成の進行状況を監視し、状態を返します。
 * - 音声合成の開始、停止、ポーズ、再開を制御するための関数を提供します。
 * - 音声合成APIがサポートされていない場合のエラーハンドリングも行います。
 *
 * @param options - 音声合成のオプション（rate, pitch, volume, voice）
 * @return { speak: (text: string) => Promise<void>, cancel: () => void, pause: () => void, resume: () => void, isSpeaking: boolean, isPaused: boolean, isSupported: boolean, isLoading: boolean, isMounted: boolean, error: string | null, availableVoices: SpeechSynthesisVoice[], setVoice: (voice: SpeechSynthesisVoice | null) => void }
 */
export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

    // マウント状態の管理（ハイドレーションエラー対策）
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // 初期化とサポート状況の確認
    useEffect(() => {
        if (!isMounted) return
        const loadVoices = async () => {
            setIsLoading(true)
            try {
                // 音声合成APIの初期化を実行
                const japaneseVoices = await getJapaneseVoices()
                const supported = japaneseVoices.length > 0
                setIsSupported(supported)
                setAvailableVoices(japaneseVoices)
                if (!supported) setError('日本語音声が取得できませんでした')
            } catch (initError) {
                // 初期化に失敗した場合はサポート外として扱う
                setIsSupported(false)
                setAvailableVoices([])
                setError(initError instanceof Error ? initError.message : '音声合成の初期化に失敗しました')
                console.warn('音声合成の初期化に失敗しました:', initError)
            } finally {
                setIsLoading(false)
            }
        }
        loadVoices()
    }, [isMounted])

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
        isMounted,
        error,
        availableVoices,
        setVoice,
    }
}