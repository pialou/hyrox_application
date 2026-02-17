import { useState, useRef, useEffect } from "react";
import { Send, Mic, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

export function Coach() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Salut Louis ! 👋 Je suis ton coach Hyrox. Comment puis-je t'aider aujourd'hui ?\n\nTu peux me demander de:\n• Créer une séance personnalisée\n• Analyser tes données Strava\n• Ajuster ton plan d'entraînement\n• Répondre à tes questions sur Hyrox",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Add streaming assistant message placeholder
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true
        }]);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.pialou.eu';
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    sessionKey: 'hyrox-main'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const reply = data.reply || data.message || 'Réponse reçue.';

            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: reply, isStreaming: false }
                    : m
            ));
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: "Désolé, impossible de contacter le coach. Vérifie ta connexion.", isStreaming: false }
                    : m
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button
                        onClick={() => navigate("/")}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg">Coach IA</h1>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                En ligne
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {messages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                ))}

                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white/10 rounded-2xl rounded-tl-md px-4 py-3">
                            <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4">
                <div className="flex items-end gap-3 max-w-3xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Écris ton message..."
                            rows={1}
                            className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 resize-none transition-all"
                        />
                        <button
                            onClick={() => {/* TODO: Voice input */ }}
                            className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <Mic className="w-4 h-4 text-white/60" />
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            input.trim() && !isLoading
                                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                        )}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isUser
                    ? "bg-gradient-to-br from-blue-400 to-blue-600"
                    : "bg-gradient-to-br from-green-400 to-green-600"
            )}>
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Bubble */}
            <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                isUser
                    ? "bg-blue-500 rounded-tr-md text-white"
                    : "bg-white/10 rounded-tl-md text-white/90"
            )}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <span className={cn(
                    "text-[10px] mt-1 block",
                    isUser ? "text-white/60 text-right" : "text-white/40"
                )}>
                    {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}
