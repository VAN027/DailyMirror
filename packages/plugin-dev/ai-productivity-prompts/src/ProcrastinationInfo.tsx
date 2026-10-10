import { Component } from 'solid-js';
import './App.css';

interface ProcrastinationInfoProps {
  onBackToWork: () => void;
}

export const ProcrastinationInfo: Component<ProcrastinationInfoProps> = (props) => {
  return (
    <div class="page-fade info-content">
      <div class="intro">
        <h2>理解拖延</h2>
        <p>
          <strong>拖延常常与情绪调节有关，并不只是时间安排的问题。</strong>
        </p>
      </div>

      <section>
        <h3>拖延的循环</h3>
        <p>面对引发不适情绪的任务时，我们可能陷入这样的循环：</p>
        <div class="procrastination-graph">
          <div class="graph-item">害怕失败</div>
          <div class="sync-icon">→</div>
          <div class="graph-item">回避任务</div>
          <div class="sync-icon">→</div>
          <div class="graph-item">暂时轻松</div>
          <div class="sync-icon">→</div>
          <div class="graph-item">更加焦虑</div>
        </div>
      </section>

      <section>
        <h3>打破循环</h3>
        <p>用好奇和理解面对拖延，不要急着责备自己。试着问：</p>
        <ul>
          <li>想到这项任务时，我有什么感受？</li>
          <li>具体哪个部分最困难？</li>
          <li>如果开始行动，我担心会发生什么？</li>
        </ul>
      </section>

      <section>
        <h3>可以尝试的方法</h3>
        <ul>
          <li>
            <strong>从小处开始：</strong> 现在能做的最小一步是什么？
          </li>
          <li>
            <strong>限定时间：</strong> 只做 10–25 分钟，然后休息
          </li>
          <li>
            <strong>换个角度：</strong> 关注进步，不苛求完美
          </li>
          <li>
            <strong>善待自己：</strong> 像对待好朋友那样与自己对话
          </li>
        </ul>
      </section>

      <section>
        <h3>常见诱因</h3>
        <p>
          追求完美、害怕失败、不知所措、要求不明确或任务枯燥，都可能引发拖延。找到自己的诱因，是迈出下一步的开始。
        </p>
      </section>

      <div class="action-buttons">
        <button
          class="btn-primary"
          onClick={props.onBackToWork}
        >
          回到工作
        </button>
      </div>
    </div>
  );
};
