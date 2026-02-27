import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const Popup = () => {
  return (
    <div className="w-[300px] p-4 bg-white text-gray-800 font-sans">
      <h1 className="text-lg font-bold mb-3 border-b pb-2 text-blue-600">
        全局四象限专注计时
      </h1>
      
      <div className="space-y-4 text-sm">
        <section>
          <h2 className="font-semibold mb-1 text-gray-700">🚀 快速开始</h2>
          <p className="text-gray-600 leading-relaxed text-xs mb-2">
            插件悬浮窗已自动显示在网页右下角。请按以下步骤操作：
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>
              <span className="font-medium text-gray-800">创建任务</span>：
              <div className="pl-5 text-xs text-gray-500 mt-0.5">
                在任意象限的输入框中输入任务名称，按 <span className="bg-gray-100 px-1 rounded border">Enter</span> 键添加。
              </div>
            </li>
            <li>
              <span className="font-medium text-gray-800">开始专注</span>：
              <div className="pl-5 text-xs text-gray-500 mt-0.5">
                直接点击任务条目，计时器立即启动。再次点击或点击底部“休息”可暂停。
              </div>
            </li>
            <li>
              <span className="font-medium text-gray-800">结束任务</span>：
              <div className="pl-5 text-xs text-gray-500 mt-0.5">
                悬停在任务上，点击 <span className="inline-flex items-center justify-center w-4 h-4 bg-green-50 rounded text-green-600 border border-green-200 text-[10px]">✓</span> 完成任务；
                或点击底部“结束”按钮停止当前专注。
              </div>
            </li>
          </ol>
        </section>

        <section className="pt-2 border-t border-dashed">
          <h2 className="font-semibold mb-1 text-gray-700">💡 交互小贴士</h2>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
            <li><span className="font-medium text-gray-800">编辑</span>：悬停任务点击铅笔图标修改名称</li>
            <li><span className="font-medium text-gray-800">拖动</span>：按住顶部标题栏可自由移动位置</li>
            <li><span className="font-medium text-gray-800">最小化</span>：点击右上角 "-" 收起为胶囊</li>
            <li><span className="font-medium text-gray-800">统计</span>：点击饼图图标查看今日数据</li>
          </ul>
        </section>
        
        <div className="pt-2 text-center text-xs text-gray-400 border-t">
          让每一分钟都更有价值
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
