(function(root) {
  'use strict';
  var M = root.MBB;
  var COLORS = {
    ink: '#151515', paper: '#FFF7D8', blue: '#1557FF', yellow: '#FFCC18', red: '#FF654D', white: '#FFFFFF'
  };

  function linesFor(ctx, text, width) {
    var lines = [];
    var line = '';
    String(text || '').split('').forEach(function(char) {
      if (line && ctx.measureText(line + char).width > width) {
        lines.push(line);
        line = char;
      } else line += char;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawLines(ctx, text, x, y, width, lineHeight) {
    var lines = linesFor(ctx, text, width);
    lines.forEach(function(line, index) { ctx.fillText(line, x, y + index * lineHeight); });
    return y + lines.length * lineHeight;
  }

  function drawCard(ctx, x, y, width, height, fill, lineWidth) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = lineWidth || 5;
    ctx.strokeRect(x, y, width, height);
  }

  function fitHeading(ctx, text, maxSize, minSize, width) {
    var size = maxSize;
    do {
      ctx.font = '900 ' + size + 'px Arial, "Microsoft YaHei", sans-serif';
      size -= 2;
    } while (size >= minSize && ctx.measureText(text).width > width);
  }

  function drawStat(ctx, x, y, label, value) {
    drawCard(ctx, x, y, 294, 116, COLORS.white);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 23px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(label, x + 20, y + 36);
    ctx.font = '900 42px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(String(value), x + 20, y + 90);
  }

  function fallbackLifeEnding(report) {
    return {
      title: report.ending || '职业旅程结束',
      outcome: report.quote || '会议结束了，你的人生还在继续。',
      joke: '工牌停在这一页，日子翻到了下一页。',
      triggerSummary: '你在麦波恩做了 ' + report.years + ' 年，最终停在' + report.rankCn + '，完成 ' + report.promotions + ' 次晋升。',
      detail: '报告正在补写你离开会议室之后的人生。'
    };
  }

  M.drawJourneyReport = function(canvas, report) {
    canvas.width = 1080;
    canvas.height = 1420;
    var ctx = canvas.getContext('2d');
    var lifeEnding = report.lifeEnding || fallbackLifeEnding(report);

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, 1080, 1420);

    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(0, 0, 1080, 218);
    ctx.fillStyle = COLORS.white;
    ctx.font = '900 38px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(report.brand, 60, 70);
    ctx.font = '900 76px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText('咨询人生结局', 60, 165);
    drawCard(ctx, 820, 43, 190, 58, COLORS.yellow, 4);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 24px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText('可转发版', 854, 81);

    drawCard(ctx, 60, 258, 960, 802, COLORS.white, 6);
    ctx.fillStyle = COLORS.blue;
    ctx.font = '900 30px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText('十年后的你', 96, 318);
    ctx.fillStyle = COLORS.ink;
    fitHeading(ctx, lifeEnding.title, 76, 48, 840);
    ctx.fillText(lifeEnding.title, 96, 408);
    ctx.font = '700 36px Arial, "Microsoft YaHei", sans-serif';
    drawLines(ctx, lifeEnding.outcome, 96, 478, 840, 48);

    drawCard(ctx, 96, 594, 840, 144, COLORS.yellow, 4);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 34px Arial, "Microsoft YaHei", sans-serif';
    drawLines(ctx, lifeEnding.joke, 128, 650, 776, 44);

    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(96, 786);
    ctx.lineTo(936, 786);
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 24px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText('为什么是这个结局', 96, 838);
    ctx.font = '700 25px Arial, "Microsoft YaHei", sans-serif';
    var summaryBottom = drawLines(ctx, lifeEnding.triggerSummary, 96, 882, 840, 34);
    ctx.font = '700 27px Arial, "Microsoft YaHei", sans-serif';
    drawLines(ctx, lifeEnding.detail, 96, summaryBottom + 18, 840, 36);

    drawStat(ctx, 60, 1110, '最终职级', report.rankCn);
    drawStat(ctx, 393, 1110, '工作年数', report.years + ' 年');
    drawStat(ctx, 726, 1110, '晋升次数', report.promotions + ' 次');

    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 28px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText('你的朋友能把这张工牌戴到第几年？', 60, 1390);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.blue;
    ctx.fillText('MBB · UP OR OUT', 1020, 1390);
    ctx.textAlign = 'left';
    return canvas.toDataURL('image/png');
  };
})(window);
