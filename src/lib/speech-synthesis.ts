interface SpeakOptions {
    text: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error?: Error) => void;
    onPause?: () => void;
    onResume?: () => void;
}

interface SpeechSynthesisState {
    isSupported: boolean;
    isInitialized: boolean;
    availableVoices: SpeechSynthesisVoice[];
    currentUtterance: SpeechSynthesisUtterance | null;
    stateMonitorInterval: NodeJS.Timeout | null;
}

const speechState: SpeechSynthesisState = {
    isSupported: false,
    isInitialized: false,
    availableVoices: [],
    currentUtterance: null,
    stateMonitorInterval: null
}

/**
 * Speech Synthesis APIの機能サポートを詳細に確認
 */
function checkSpeechSynthesisSupport(): boolean {
    // サーバーサイドレンダリング環境の確認
    if (typeof window === 'undefined') {
        return false
    }

    // 基本的なAPIサポート確認
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        return false
    }

    // 必要なメソッドの存在確認
    const synthesis = window.speechSynthesis
    const requiredMethods = ['speak', 'cancel', 'pause', 'resume', 'getVoices']

    for (const method of requiredMethods) {
        if (typeof synthesis[method as keyof SpeechSynthesis] !== 'function') {
            return false
        }
    }

    return true
}

/**
 * Speech Synthesis APIの初期化
 */
function initializeSpeechSynthesis(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (speechState.isInitialized) {
            resolve()
            return
        }

        if (!checkSpeechSynthesisSupport()) {
            speechState.isSupported = false
            reject(new Error('Speech Synthesis APIがサポートされてません'))
            return
        }

        speechState.isSupported = true

        // 音声一覧の取得（非同期で取得される場合がある）
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices()
            if (voices.length > 0) {
                speechState.availableVoices = voices
                speechState.isInitialized = true
                resolve()
            } else {
                // 音声データの読み込み完了を待つ
                const voicesChangedHandler = () => {
                    const voicesAfterChange = window.speechSynthesis.getVoices()
                    if (voicesAfterChange.length > 0) {
                        speechState.availableVoices = voicesAfterChange
                        speechState.isInitialized = true
                        resolve()
                    }
                }

                window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler, { once: true })

                // タイムアウト設定（5秒後に強制的に初期化完了とする）
                setTimeout(() => {
                    // { once: true }により自動的にリスナーは削除されるため、手動削除は不要
                    // タイムアウト時にも現在利用可能な音声を取得
                    const currentVoices = window.speechSynthesis.getVoices()
                    speechState.availableVoices = currentVoices
                    speechState.isInitialized = true

                    if (currentVoices.length === 0) console.warn('音声一覧の取得がタイムアウトしました。音声合成機能が制限される可能性があります。')
                    resolve()
                }, 5000)
            }
        }
        loadVoices();
    })
}

/**
 * 日本語音声の取得
 */
function getJapaneseVoice(): SpeechSynthesisVoice | null {
    const japaneseVoices = speechState.availableVoices.filter(voice =>
        voice.lang.startsWith('ja') || voice.lang.startsWith('jp')
    )

    return japaneseVoices.length > 0 ? japaneseVoices[0] : null
}

function startStateMonitoring(): void {
    if (speechState.stateMonitorInterval) {
        return  // 既に監視中
    }

    speechState.stateMonitorInterval = setInterval(() => {
        if (!checkSpeechSynthesisSupport()) {
            return
        }

        const synthesis = window.speechSynthesis
        const hasCurrentUtterance = speechState.currentUtterance !== null
        const isActuallySpeaking = synthesis.speaking || synthesis.pending

        // 状態不整合の検出と修正
        if (hasCurrentUtterance && !isActuallySpeaking) {
            // 内部状態では音声合成中だが、実際には停止している場合
            console.warn('音声合成状態の不整合を検出し、修正しました')
            speechState.currentUtterance = null
        } else if (!hasCurrentUtterance && isActuallySpeaking) {
            // 内部状態では停止しているが、実際には音声合成中の場合
            console.warn('予期しない音声合成を検出し、停止しました')
            synthesis.cancel()
        }

        // 監視が不要になった場合は停止
        if (!hasCurrentUtterance && !isActuallySpeaking) {
            stopStateMonitoring()
        }
    }, 200) // 200ms毎に状態をチェック
}

/**
 * 状態監視を停止する
 */
function stopStateMonitoring(): void {
    if (speechState.stateMonitorInterval) {
        clearInterval(speechState.stateMonitorInterval)
        speechState.stateMonitorInterval = null
    }
}

/**
 * 状態を安全にクリアする（堅牢な状態管理）
 */
function clearSpeechState(): void {
    speechState.currentUtterance = null
    stopStateMonitoring()
}

/**
 * Web Speech APIの SpeechSynthesisUtterance を使用して、指定されたテキストを音声で読み上げる。
 * - クロスブラウザ対応のため、SafariやChrome等の制限事項を考慮した実装
 * - 音声合成をサポートしていないブラウザでは安全に処理を停止
 * - エラーハンドリングとメモリリーク対策を含む
 * 
 * @param options - 音声合成のオプション
 * @returns Promise<SpeechSynthesisUtterance | null>: 非同期で初期化後、SpeechSynthesisUtteranceインスタンスを返すか、サポートされていない場合はnullを返す。
 */
export async function speakText(options: SpeakOptions): Promise<SpeechSynthesisUtterance | null> {
    try {
        await initializeSpeechSynthesis()

        if (!speechState.isSupported) {
            options.onError?.(new Error('Speech Synthesisはサポート対象外です'))
            return null
        }
        // 既存の音声合成を停止
        if (speechState.currentUtterance) {
            window.speechSynthesis.cancel()
            clearSpeechState()
        }

        const {
            text,
            rate = 1.0,
            pitch = 1.0,
            volume = 1.0,
            voice,
            onStart,
            onEnd,
            onError,
            onPause,
            onResume
        } = options

        // テキストの検証
        if (!text || text.trim().length === 0) {
            onError?.(new Error('Text is empty'))
            return null
        }

        const utterance = new window.SpeechSynthesisUtterance(text)

        // 設定値の適用（範囲チェック付き）
        utterance.rate = Math.max(0.1, Math.min(10, rate))
        utterance.pitch = Math.max(0, Math.min(2, pitch))
        utterance.volume = Math.max(0, Math.min(1, volume))

        // 音声の設定
        const selectedVoice = voice || getJapaneseVoice()
        if (selectedVoice) {
            utterance.voice = selectedVoice
            utterance.lang = selectedVoice.lang
        } else {
            utterance.lang = 'ja-JP'
        }

        // イベントハンドラーの設定
        utterance.onstart = () => {
            speechState.currentUtterance = utterance
            startStateMonitoring()
            try {
                onStart?.()
            } catch (error) {
                console.warn('onStartハンドラーでエラーが発生しました:', error)
            }
        }

        utterance.onend = () => {
            clearSpeechState()
            try {
                onEnd?.()
            } catch (error) {
                console.warn('onEndハンドラーでエラーが発生しました:', error)
            }
        }

        utterance.onpause = () => {
            try {
                onPause?.()
            } catch (error) {
                console.warn('onPauseハンドラーでエラーが発生しました:', error)
            }
        }

        utterance.onresume = () => {
            try {
                onResume?.()
            } catch (error) {
                console.warn('onResumeハンドラーでエラーが発生しました:', error)
            }
        }

        utterance.onerror = (event) => {
            clearSpeechState()
            try {
                onError?.(new Error(`音声合成エラー: ${event.error}`))
            } catch (error) {
                console.warn('onErrorハンドラーでエラーが発生しました:', error)
            }
        }
        // 音声合成の実行
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel()
        }
        window.speechSynthesis.speak(utterance)

        return utterance

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '音声読み上げ時にエラーが起きました';
        options.onError?.(new Error(`speech synthesisの初期化失敗: ${errorMessage}`));
        return null;
    }
}

/**
 * 音声合成中止。
 * Web Speech APIの SpeechSynthesis を使用して、音声合成中止。
 * - Web Speech APIがサポートされていない場合は何も行わない。
 * - 現在の音声合成状態を適切にクリアする
 * - ライフサイクルの一貫性を保つため、onendハンドラ経由でのみcurrentUtteranceをクリア
 */
export function cancelSpeech(): void {
    if (!checkSpeechSynthesisSupport()) {
        return
    }

    try {
        window.speechSynthesis.cancel()
        clearSpeechState()
    } catch (error) {
        console.warn('cancel speech synthesisに失敗しました:', error)
        // エラー時は確実に状態をクリア
        clearSpeechState()
    }
}

/**
 * 音声合成を一時停止
 */
export function pauseSpeech(): void {
    if (!checkSpeechSynthesisSupport()) {
        return;
    }

    try {
        window.speechSynthesis.pause();
    } catch (error) {
        console.warn('pause speech synthesisに失敗しました:', error);
    }
}

/**
 * 音声合成を再開
 */
export function resumeSpeech(): void {
    if (!checkSpeechSynthesisSupport()) {
        return;
    }

    try {
        window.speechSynthesis.resume();
    } catch (error) {
        console.warn('resume speech synthesisに失敗しました:', error);
    }
}

/**
 * 音声合成の状態を取得
 */
export function getSpeechSynthesisState(): {
    isSupported: boolean;
    isInitialized: boolean;
    isSpeaking: boolean;
    isPaused: boolean;
    availableVoices: SpeechSynthesisVoice[];
    isMonitoring: boolean;
} {
    if (!checkSpeechSynthesisSupport()) {
        return {
            isSupported: false,
            isInitialized: false,
            isSpeaking: false,
            isPaused: false,
            availableVoices: [],
            isMonitoring: false
        }
    }

    return {
        isSupported: speechState.isSupported,
        isInitialized: speechState.isInitialized,
        isSpeaking: window.speechSynthesis.speaking,
        isPaused: window.speechSynthesis.paused,
        availableVoices: speechState.availableVoices,
        isMonitoring: speechState.stateMonitorInterval !== null
    }
}

/**
 * 利用可能な日本語音声一覧を取得
 */
export async function getJapaneseVoices(): Promise<SpeechSynthesisVoice[]> {
    try {
        await initializeSpeechSynthesis()
        return speechState.availableVoices.filter(voice =>
            voice.lang.startsWith('ja') || voice.lang.startsWith('jp')
        )
    } catch (error) {
        console.warn('日本語音声一覧の取得に失敗しました:', error)
        return []
    }
}

export function cleanupSpeechSynthesis(): void {
    try {
        cancelSpeech()
        clearSpeechState()
    } catch (error) {
        console.warn('Speech Synthesisのクリーンアップに失敗しました:', error)
    }
}