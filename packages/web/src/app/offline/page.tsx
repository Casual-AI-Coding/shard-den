import { WifiOff, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">
          您已离线
        </h1>

        <p className="text-slate-400">
          网络连接已断开。请检查您的网络设置，然后重试。
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          <Home className="w-5 h-5" />
          返回首页
        </Link>

        <p className="text-sm text-slate-500">
          ShardDen 工具可以在离线状态下使用部分功能
        </p>
      </div>
    </div>
  );
}
