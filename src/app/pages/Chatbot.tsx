import { useState, useEffect, useRef } from 'react';
import { Send, Smile, User } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { getCognitoId, getToken } from '../api';

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

export function Chatbot() {
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('result_id');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!resultId) return;
    const cognitoId = getCognitoId();
    const token = getToken();
    if (!cognitoId || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chatbot/${resultId}?cognito_id=${cognitoId}&token=${token || ''}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      } else if (data.type === 'history') {
        setMessages(data.messages || []);
      } else if (data.type === 'bot') {
        setMessages(prev => [...prev, { type: 'bot', content: data.content, timestamp: data.timestamp }]);
        setIsLoading(false);
      }
    };

    ws.onerror = () => setIsLoading(false);
    ws.onclose = () => setIsLoading(false);

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [resultId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const userMessage = message;
    const timestamp = new Date().toISOString();
    setMessages(prev => [...prev, { type: 'user', content: userMessage, timestamp }]);
    setMessage('');
    setIsLoading(true);

    wsRef.current.send(JSON.stringify({ message: userMessage }));
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <Smile className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">AI 영양제 상담</h1>
          <p className="text-xs text-gray-400">분석 결과를 기반으로 질문하세요</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16 animate-fade-up">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smile className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">무엇이든 물어보세요</p>
              <p className="text-gray-300 text-xs mt-1">분석 결과에 대해 궁금한 점을 질문해보세요.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-3 animate-fade-up ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.type === 'bot' && (
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mb-1">
                  <Smile className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div
                className={`max-w-md rounded-2xl px-4 py-3 text-sm ${msg.type === 'bot'
                  ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
                  : 'bg-blue-500 text-white rounded-br-sm'
                  }`}
              >
                <p className="leading-relaxed">{msg.content}</p>
                {msg.timestamp && (
                  <p className={`text-xs mt-1.5 ${msg.type === 'bot' ? 'text-gray-300' : 'text-blue-200'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {msg.type === 'user' && (
                <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 mb-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mb-1">
                <Smile className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
