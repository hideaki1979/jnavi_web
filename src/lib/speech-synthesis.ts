interface SpeakOptions {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: () => void;
}

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

export function cancelSpeech() {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
}