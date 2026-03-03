'use client';

import React, { useState } from 'react';

interface TemplateLibraryProps {
  onSelect: (code: string) => void;
}

interface Template {
  id: string;
  name: string;
  category: string;
  code: string;
}

const TEMPLATES: Template[] = [
  // Flowchart
  {
    id: 'flowchart-basic',
    name: '基础流程图',
    category: '流程图',
    code: `flowchart TD
    A[开始] --> B{判断}
    B -->|是| C[处理1]
    B -->|否| D[处理2]
    C --> E[结束]
    D --> E`,
  },
  {
    id: 'flowchart-lr',
    name: '横向流程图',
    category: '流程图',
    code: `flowchart LR
    A[输入] --> B[处理]
    B --> C[输出]
    B --> D[日志]
    D --> B`,
  },
  // Sequence Diagram
  {
    id: 'sequence-basic',
    name: '基础时序图',
    category: '时序图',
    code: `sequenceDiagram
    participant 用户
    participant 系统
    participant 数据库
    
    用户->>系统: 发起请求
    系统->>数据库: 查询数据
    数据库-->>系统: 返回结果
    系统-->>用户: 返回响应`,
  },
  {
    id: 'sequence-loop',
    name: '循环时序图',
    category: '时序图',
    code: `sequenceDiagram
    participant A as 客户端
    participant B as 服务器
    
    A->>B: 请求
    loop 3次
        B->>B: 处理
    end
    B-->>A: 响应`,
  },
  // Class Diagram
  {
    id: 'class-basic',
    name: '类图',
    category: '类图',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    Animal <|-- Dog`,
  },
  {
    id: 'class-interface',
    name: '接口类图',
    category: '类图',
    code: `classDiagram
    class Shape {
        <<interface>>
        +draw()
        +getArea()
    }
    
    class Circle implements Shape {
        -double radius
        +draw()
        +getArea()
    }
    
    class Rectangle implements Shape {
        -double width
        -double height
        +draw()
        +getArea()
    }`,
  },
  // State Diagram
  {
    id: 'state-basic',
    name: '状态图',
    category: '状态图',
    code: `stateDiagram-v2
    [*] --> 初态
    初态 --> 进行中: 开始
    进行中 --> 完成: 成功
    进行中 --> 失败: 错误
    完成 --> [*]
    失败 --> 初态: 重试`,
  },
  // ER Diagram
  {
    id: 'er-basic',
    name: 'ER图',
    category: 'ER图',
    code: `erDiagram
    用户 ||--o{ 订单 : "下"
    订单 ||--|{ 商品订单 : "包含"
    商品 ||--o{ 商品订单 : "被包含"
    
    用户 {
        int id PK
        string name
        string email
    }
    
    订单 {
        int id PK
        date created
        decimal total
    }`,
  },
  // Gantt
  {
    id: 'gantt-basic',
    name: '甘特图',
    category: '其他',
    code: `gantt
    title 项目进度
    dateFormat  YYYY-MM-DD
    section 阶段1
    任务1: a1, 2024-01-01, 7d
    任务2: a2, after a1, 5d
    section 阶段2
    任务3: b1, after a2, 10d
    任务4: b2, after b1, 5d`,
  },
];

// 虚拟滚动配置 (Section 4.3 设计文档)
const VIRTUAL_SCROLL_CONFIG = {
  itemHeight: 150,
  visibleCount: 6,
  bufferCount: 3,
};

// 生成更多模板数据用于测试虚拟滚动
function generateExtendedTemplates(): Template[] {
  const categories = ['流程图', '时序图', '类图', '状态图', 'ER图', '其他'];
  const templates: Template[] = [];
  
  // 保留原有模板
  templates.push(...TEMPLATES);
  
  // 生成额外模板
  for (let i = 0; i < 50; i++) {
    const category = categories[i % categories.length];
    templates.push({
      id: `template-${i}`,
      name: `${category}模板 ${i + 1}`,
      category,
      code: `flowchart TD
    A[节点 ${i + 1}] --> B[节点 ${i + 2}]
    B --> C[节点 ${i + 3}]`,
    });
  }
  
  return templates;
}

const EXTENDED_TEMPLATES = generateExtendedTemplates();

// 虚拟滚动 Hook (Section 4.3 设计文档)
function useVirtualScroll<T>(
  items: T[],
  config: typeof VIRTUAL_SCROLL_CONFIG
) {
  const { itemHeight, bufferCount } = config;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(
    config.visibleCount * config.itemHeight
  );

  // 计算总高度
  const totalHeight = items.length * itemHeight;

  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferCount);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferCount
  );

  // 获取可见项
  const visibleItems = items.slice(startIndex, endIndex);

  // 处理滚动
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 监听容器高度变化
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  return {
    containerRef,
    handleScroll,
    totalHeight,
    startIndex,
    visibleItems,
    itemHeight,
  };
}

const CATEGORIES = ['全部', '流程图', '时序图', '类图', '状态图', 'ER图', '其他'];

export default function TemplateLibrary({ onSelect }: TemplateLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const filteredTemplates = selectedCategory === '全部' 
    ? EXTENDED_TEMPLATES 
    : EXTENDED_TEMPLATES.filter(t => t.category === selectedCategory);

  // 使用虚拟滚动
  const {
    containerRef,
    handleScroll,
    totalHeight,
    startIndex,
    visibleItems,
    itemHeight,
  } = useVirtualScroll(filteredTemplates, VIRTUAL_SCROLL_CONFIG);

  const handleSelect = (code: string) => {
    onSelect(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13a1 1 0 011-1h14a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        </svg>
        <span>模板库</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-1 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-[var(--border)]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template list - 虚拟滚动 (Section 4.3) */}
            <div 
              ref={containerRef}
              onScroll={handleScroll}
              className="overflow-y-auto p-2"
              style={{ 
                position: 'relative', 
                height: `${VIRTUAL_SCROLL_CONFIG.visibleCount * VIRTUAL_SCROLL_CONFIG.itemHeight}px` 
              }}
            >
              <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                {visibleItems.map((template, index) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.code)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--surface-hover)] rounded transition-colors"
                    style={{
                      position: 'absolute',
                      top: `${(startIndex + index) * itemHeight}px`,
                      left: 0,
                      right: 0,
                      height: `${itemHeight}px`,
                    }}
                  >
                    <div className="text-sm text-[var(--text)] font-medium">{template.name}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{template.category}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono truncate">
                      {template.code.split('\n')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
