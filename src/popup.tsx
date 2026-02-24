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
          <p className="text-gray-600 leading-relaxed">
            无需额外操作，插件悬浮窗会自动出现在所有网页的右下角。
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1 text-gray-700">✨ 核心功能</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><span className="font-medium text-gray-800">四象限管理</span>：按重要/紧急程度分类任务</li>
            <li><span className="font-medium text-gray-800">专注计时</span>：点击任务开始计时，再次点击暂停</li>
            <li><span className="font-medium text-gray-800">全局同步</span>：所有标签页状态实时同步</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-1 text-gray-700">🖱️ 交互指南</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><span className="font-medium text-gray-800">拖动</span>：按住顶部标题栏可自由移动悬浮窗</li>
            <li><span className="font-medium text-gray-800">最小化</span>：点击右上角 "-" 号收起为胶囊</li>
            <li><span className="font-medium text-gray-800">删除</span>：悬停在任务上，点击红色垃圾桶图标</li>
            <li><span className="font-medium text-gray-800">统计</span>：点击饼图图标查看今日专注数据</li>
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
