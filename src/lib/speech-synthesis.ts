interface SpeakOptions {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: () => void;
}

/**
 * 指定されたテキストを音声で読み上げる。
 * Web Speech APIの SpeechSynthesisUtterance を使用して、指定されたテキストを音声で読み上げる。
 * - text: 読み上げるテキスト
 * - lang: 読み上げる言語 (ja-JP, en-US, etc.) (default: "ja-JP")
 * - rate: 読み上げる速度 (0.1 ~ 10.0) (default: 0.7)
 * - pitch: 読み上げるピッチ (0.1 ~ 2.0) (default: 1.0)
 * - onEnd: 読み上げが完了したときに呼び出されるコールバック
 * - onError: 読み上げにエラーが発生したときに呼び出されるコールバック
 * @returns SpeechSynthesisUtterance | null: SpeechSynthesisUtteranceインスタンスを返すか、Web Speech APIがサポートされていない場合はnullを返す。
 */
export function speakText({
    text,
    lang = "ja-JP",
    rate = 0.7,
    pitch = 1.0,
    onEnd,
    onError
}: SpeakOptions): SpeechSynthesisUtterance | null {
    if (typeof window === "undefined" || !window.speechSynthesis) return null
    const utter = new window.SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = pitch
    if (onEnd) utter.onend = onEnd
    if (onError) utter.onerror = onError
    window.speechSynthesis.speak(utter)
    return utter
}

/**
 * 音声合成中止。
 * Web Speech APIの SpeechSynthesis を使用して、音声合成中止。
 * - Web Speech APIがサポートされていない場合は何も行わない。
 * @returns void
 */
export function cancelSpeech() {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
}