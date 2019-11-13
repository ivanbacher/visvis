
import * as d3 from 'd3';


import 'normalize.css';

var DEFAULT_DATA = './example/00018.meta.json'

// debugger;

//https://github.com/distillpub/post--augmented-rnns/blob/master/public/assets/rnn_attentional_ex3.html


export class App {
  constructor() {
    this.mouthSource = '';
    this.waveSrc = '';
    this.labels = '';
    this.metaFiles = [];
    this.fileIndex = 0;
    this.data_ = null;
  }

  handleFiles(event) {
    let files = event.target.files;

    for (let i = 0; i < files.length; i++) {
      let f = files[i];
      if (f.webkitRelativePath.match(/.*\.meta\.json$/)) {
        this.metaFiles.push(f);
      }
    }
    this.next();
  }


  previous() {
    this.readMeta(this.metaFiles[this.fileIndex]).then( (data) => {
      this.doAttached(data);
      this.fileIndex--;
    });
  }

  next() {
    this.readMeta(this.metaFiles[this.fileIndex]).then( (data) => {
      this.doAttached(data);
      this.fileIndex++;
    });
  }

  readMeta(file) {
    let p = new Promise( (resolve, reject) => {
      let reader = new FileReader();

      reader.onload = (evt) => {
        let data = JSON.parse(evt.target.result);

        resolve(data);
      };
      reader.readAsText(this.metaFiles[this.fileIndex], 'UTF-8');
    });

    return p;
  }

  activate() {
    return fetch(DEFAULT_DATA, {method: 'GET'})
	.then(response => {return response.json()})
        .then(json => { this.data_ = json});
  }

  attached() {
    this.doAttached(this.data_);
  }

  doAttached(data) {
    let data1 = data['text-audio'];
    let data2 = data['audio-video'];
    this.labels = data['labels'];
    this.videoFrames = data['video-frames'];
    this.waveSrc = data['spectrogram']

  	// LABELS -- START

    let labelsA = this.labels.map( (char) => {
      return (char === ' ') ? '_' : char;
    });
    let labelsB = d3.range(data1.length);

    let labelsC = d3.range(data2.length);
    let labelsD = d3.range(data2[0].length);

    console.log('A -> ', labelsA.length);
    console.log('B -> ', labelsB.length);
    console.log('C -> ', labelsC.length);
    console.log('D -> ', labelsD.length);

    //console.log(data1)
    //console.log(data2)

    // LABELS -- END


    // DATA -- START

    let linkData1 = [];
    let linkData2 = [];
    let linkTopAB = new Map();
    let linkTopDC = new Map();
    let linkTopCD = new Map();
    let topK = 3;

    data1.forEach( (a, ai) => {
      linkTopAB.set(ai,
        new Map(
          a.map( (b, bi) => {return {ai: ai, bi: +bi, val: +b};})
            .sort( (a_, b_) => +b_.val - a_.val)
            .slice(0, topK)
            .map( l => [l.bi, l] )
        )
      );

      a.forEach( (b, bi) => {
        linkData1.push({
          ai: +ai,
          bi: +bi,
          v: +data1[ai][bi]
        });
      });
    });

    data2.forEach( (c, ci) => {
      c.map( (d, di) => { return {di: +di, ci: +ci, val: +d}; })
        .sort( (a_, b_) => +b_.val - a_.val)
        .slice(0, topK)
        .forEach( l => {
          if (linkTopDC.has(+l.di)) {
            linkTopDC.get(l.di).set(+l.ci, l);
          } else {
            linkTopDC.set(+l.di, new Map([[+l.ci, l]]));
          }
          if (linkTopCD.has(+l.ci)) {
            linkTopCD.get(l.ci).set(+l.di, l);
          } else {
            linkTopCD.set(+l.ci, new Map([[+l.di, l]]));
          }
        });

      c.forEach( (d, di) => {
        linkData2.push({
          ci: +ci,
          di: +di,
          v: +data2[ci][di]
        });
      });
    });


    // DATA -- END


    let nodeMargin = 8;
    let networkMargin = 140;
    let audioHeight = 60;


    let html = d3.select('#attentional-ex3');
    let outerWidth = 984; //Math.max(700, html.node().getBoundingClientRect().width);
    let outerHeight = 520;
    let margin = {top: 36, right: nodeMargin + 80, bottom: 24, left: nodeMargin};
    let width = outerWidth - margin.left - margin.right;
    let height = outerHeight - margin.top - margin.bottom;

    let xa = d3.scaleBand()
      .domain(d3.range(labelsA.length))
      .paddingInner(0.5)
      .range([nodeMargin, width - nodeMargin]);

    let xb = d3.scaleBand()
      .domain(d3.range(labelsB.length))
      .paddingInner(0.5)
      .range([nodeMargin, width - nodeMargin]);

    let xc = d3.scaleBand()
      .domain(d3.range(labelsC.length))
      .paddingInner(0.5)
      .range([nodeMargin, width - nodeMargin]);

    let xd = d3.scaleBand()
      .domain(d3.range(labelsD.length))
      .paddingInner(0.5)
      .range([nodeMargin, width - nodeMargin]);

    let nodeSizeB = xb.bandwidth();
    let nodeSizeA = xa.bandwidth();
    let nodeSizeC = xc.bandwidth();
    let nodeSizeD = xd.bandwidth();

    let networkHeightB = nodeSizeB + nodeMargin * 2;
    let networkHeightA = nodeSizeA + nodeMargin * 2;
    let networkHeightC = nodeSizeC + nodeMargin * 2;
    let networkHeightD = nodeSizeD + nodeMargin * 2;

    // eslint-disable-next-line camelcase
    let linkA_B = function(d) { //FIXME: do we have to rename d.ai and d.bi??
      let temp = 'M' + (xa(d.ai) + nodeSizeA / 2) + ',' + (nodeSizeA + nodeMargin)
        + 'C' + (xa(d.ai) + nodeSizeA / 2) + ',' + (nodeSizeA + networkMargin / 3 + nodeMargin)
        + ' ' + (xb(d.bi) + nodeSizeB / 2) + ',' + (networkMargin - networkMargin / 3 + nodeMargin)
        + ' ' + (xb(d.bi) + nodeSizeB / 2) + ',' + (networkMargin + nodeMargin);

      return temp;
    };

    // eslint-disable-next-line camelcase
    let linkC_D = function(d) {
      return 'M' + (xc(d.ci) + nodeSizeC / 2) + ',' + (nodeSizeC + nodeMargin)
        + 'C' + (xc(d.ci) + nodeSizeC / 2) + ',' + (nodeSizeC + networkMargin / 3 + nodeMargin)
        + ' ' + (xd(d.di) + nodeSizeD / 2) + ',' + (networkMargin - networkMargin / 3 + nodeMargin)
        + ' ' + (xd(d.di) + nodeSizeD / 2) + ',' + (networkMargin + nodeMargin);
    };


    let onmouseoverA = (d, i) => {
      console.log('onmouseoverA ->', i);

      linklink1.style('display', (ld) => {
        return ld.ai === i ? '' : 'none';
      });

      linklink2.style('display', (ld) => {
        return (linkTopAB.has(i) && linkTopAB.get(i).has(ld.ci))
          ? '' : 'none';
      });

      if (linkTopAB.has(i)) {
        let bi = linkTopAB.get(i).keys().next().value;
        if (linkTopCD.has(bi)) {
          let di = linkTopCD.get(i).keys().next().value;
          this.mouthSource = this.videoFrames[di];
        }
      }
    };

    let onmouseoverB = (d, i) => {
      console.log('onmouseoverB ->', i);

      linklink1.style('display', (ld) => {
        return ld.bi === i ? '' : 'none';
      });

      if (d === null) { return; }

      linklink2.style('display', (ld) => {
        return (ld.ci === i) ? '' : 'none';
      });

      if (linkTopCD.has(i)) {
        let di = linkTopCD.get(i).keys().next().value;
        this.mouthSource = this.videoFrames[di];
      }
    };

    let onmouseoverC = (d, i) => {
      console.log('onmouseoverC ->', i);

      linklink2.style('display', (ld) => {
        return ld.ci === i ? '' : 'none';
      });

      linklink1.style('display', (ld) => {
        return ld.bi === i ? '' : 'none';
      });

      let di = linkTopCD.get(i).keys().next().value;
      this.mouthSource = this.videoFrames[di];
    };

    let onmouseoverD = (d, i)  => {
      console.log('onmouseoverD ->', i);

      linklink2.style('display', (ld) => {
        return ld.di === i ? '' : 'none';
      });

      linklink1.style('display', (ld) => {
        return linkTopDC.has(i) && linkTopDC.get(i).has(ld.bi)
          ? '' : 'none';
      });

      this.mouthSource = this.videoFrames[i];
    };

    let onmouseout = () => {
      linklink1.style('display', '');
      linklink2.style('display', '');

      this.mouthSource = '';
    };

    function pad(num, size) {
      let s = num + '';
      while (s.length < size) s = '0' + s;
      return s;
    }


    let svg = html.select('svg')
      .attr('viewBox', '0 0 ' + outerWidth + ' ' + outerHeight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    html.select('svg .labels')
      .attr('transform', 'translate(' + (width + nodeMargin * 3) + ', 0)');


    //
    // Network A
    //
    let networkA = svg.append('g')
      .attr('class', 'network-a');

    networkA.append('rect')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', nodeSizeA + 2 * nodeMargin)
      .attr('rx', nodeMargin * 0.7)
      .attr('ry', nodeMargin * 0.7);

    let cellA = networkA.selectAll('.cell')
      .data(labelsA)
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', function(d, i) { return 'translate(' + xa(i) + ', ' + nodeMargin + ')'; })
      .on('mouseover', function(d, i) {
        onmouseoverA(d, i);
      })
      .on('mouseout', function() {
        onmouseout();
      });

    cellA.append('rect')
      .attr('class', 'shadow')
      .attr('transform', 'translate(1, 3)')
      .attr('width', nodeSizeA)
      .attr('height', nodeSizeA)
      .attr('rx', 4)
      .attr('ry', 4);

    cellA.append('rect')
      .attr('class', 'node')
      .attr('width', nodeSizeA)
      .attr('height', nodeSizeA)
      .attr('rx', 2)
      .attr('ry', 2);

    cellA.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('x1', nodeSizeA)
      .attr('x2', nodeSizeA + nodeMargin)
      .attr('y1', nodeSizeA / 2)
      .attr('y2', nodeSizeA / 2);

    cellA.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('transform', 'translate(' + nodeSizeA / 2 + ', 0)')
      .attr('y1', 0)
      .attr('y2', -nodeMargin * 2);

    cellA.append('text')
      .attr('class', 'label')
      .attr('dx', nodeSizeA / 2)
      .attr('dy', - nodeMargin * 2 - 15)
      .text(function(d) { return d; });

    cellA.append('rect')
      .style('opacity', 0)
      .attr('transform', 'translate(-' + ((xa.step() - nodeSizeA) / 2) + ',-' + nodeMargin + ')')
      .attr('width', xa.step())
      .attr('height', networkHeightA + (networkMargin - networkHeightA) / 2);


    //
    // Network B
    //
    let networkB = svg.append('g')
      .attr('class', 'network-b')
      .attr('transform', 'translate(0, ' + networkMargin + ')');

    networkB.append('rect')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', nodeSizeB + 2 * nodeMargin)
      .attr('rx', nodeMargin * 0.7)
      .attr('ry', nodeMargin * 0.7);


    let cellB = networkB.selectAll('.cell')
      .data(labelsB)
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', function(d, i) { return 'translate(' + xb(i) + ', ' + nodeMargin + ')'; })
      .on('mouseover', function(d, i) {
        onmouseoverB(d, i);
      })
      .on('mouseout', function() {
        onmouseout();
      });


    cellB.append('rect')
      .attr('class', 'shadow')
      .attr('transform', 'translate(1, 3)')
      .attr('width', nodeSizeB)
      .attr('height', nodeSizeB)
      .attr('rx', 4)
      .attr('ry', 4);

    cellB.append('rect')
      .attr('class', 'node')
      .attr('width', nodeSizeB)
      .attr('height', nodeSizeB)
      .attr('rx', 2)
      .attr('ry', 2);

    cellB.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('x1', nodeSizeB)
      .attr('x2', nodeSizeB + nodeMargin)
      .attr('y1', nodeSizeB / 2)
      .attr('y2', nodeSizeB / 2);

    cellB.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('transform', 'translate(' + nodeSizeB / 2 + ', ' + nodeSizeB + ')')
      .attr('y1',  nodeMargin * 3)
      .attr('y2',  4);

    cellB.append('rect')
      .style('opacity', 0)
      .attr('transform', 'translate(-' + ((xb.step() - nodeSizeB) / 2) + ',-' + (nodeMargin + (networkMargin - networkHeightA) / 2) + ')')
      .attr('width', xb.step())
      .attr('height', networkHeightB + (networkMargin - networkHeightB) / 2 + audioHeight + nodeMargin * 2);


    //
    // Links 1 (B - A)
    //
    let linkGroup1 = svg.append('g').attr('class', '.link-group-1');

    let linklink1 = linkGroup1.selectAll('.link')
      .data(linkData1)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', linkA_B)
      .style('opacity', function(d) { return d.v; });


    //
    // Audio
    //
    html.select('.waveform')
      .style('left', '1%')
      .style('top', '49%')
      .style('width', '90%')
      .style('height', '50px');

    let audio = svg.append('g')
      .attr('class', 'audio')
      .attr('transform', 'translate(0, ' + (nodeMargin * 4 + nodeSizeB + networkMargin) + ')');

    audio.append('image')
      .attr('xlink:href', this.waveSrc)
      .attr('width', width - ( (width / 100) * 1) )
      .attr('preserveAspectRatio', 'none')
      .attr('height', audioHeight)
      .attr('transform', `translate( ${ (width / 100) * 0.5 } ,0)`); //magic numbers
    
    audio.append('rect')
      .attr('class', 'audio-background')
      .attr('width', width)
      .attr('height', audioHeight)
      .attr('rx', nodeMargin * 0.7)
      .attr('ry', nodeMargin * 0.7);

    audio.selectAll('.tick')
      .data(labelsB)
      .enter().append('line')
      .style('display', function(d) { return d === 0 ? 'none' : ''; })
      .attr('class', 'tick')
      .attr('transform', 'translate(-' + (xb.step() - xb.bandwidth()) / 2 + ', ' + 0 + ')')
      .attr('x1', function(d) { return xb(d); })
      .attr('x2', function(d) { return xb(d); })
      .attr('y2', audioHeight);

    audio.selectAll('.segment')
      .data(labelsB)
      .enter().append('rect')
      .style('opacity', 0)
      .attr('class', 'segment')
      .attr('transform', function(d) {
        return 'translate(' + ((-xb.step() + xb.bandwidth()) / 2 + xb(d)) + ', ' + nodeMargin + ')';
      })
      .attr('width', xb.step())
      .attr('height', audioHeight);


    //
    // Network C
    //
    let networkC = svg.append('g')
      .attr('class', 'network-c')
      .attr('transform', 'translate(0, ' + (nodeMargin * 4 + nodeSizeC + networkMargin + (audioHeight + nodeSizeC) ) + ')');

    networkC.append('rect')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', nodeSizeC + 2 * nodeMargin)
      .attr('rx', nodeMargin * 0.7)
      .attr('ry', nodeMargin * 0.7);


    let cellC = networkC.selectAll('.cell')
      .data(labelsC) //probably will have to change this
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', function(d, i) { return 'translate(' + xc(i) + ', ' + nodeMargin + ')'; })
      .on('mouseover', function(d, i) {
        onmouseoverC(d, i);
      })
      .on('mouseout', function() {
        onmouseout();
      });


    cellC.append('rect')
      .attr('class', 'shadow')
      .attr('transform', 'translate(1, 3)')
      .attr('width', nodeSizeC)
      .attr('height', nodeSizeC)
      .attr('rx', 4)
      .attr('ry', 4);

    cellC.append('rect')
      .attr('class', 'node')
      .attr('width', nodeSizeC)
      .attr('height', nodeSizeC)
      .attr('rx', 2)
      .attr('ry', 2);

    cellC.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('x1', nodeSizeC)
      .attr('x2', nodeSizeC + nodeMargin)
      .attr('y1', nodeSizeC / 2)
      .attr('y2', nodeSizeC / 2);

    cellC.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('transform', 'translate(' + nodeSizeC / 2 + ', ' + - (nodeSizeC * 2) + ')')
      .attr('y1',  nodeMargin * 3)
      .attr('y2',  4);

    cellC.append('rect')
      .style('opacity', 0)
      .attr('transform', 'translate(-' + ((xc.step() - nodeSizeC) / 2) + ',-' + (nodeMargin + (networkMargin - networkHeightD) / 2) + ')')
      .attr('width', xc.step())
      .attr('height', networkHeightB + (networkMargin - networkHeightC) / 2 + audioHeight + nodeMargin * 2);


    //
    // Network D
    //
    let networkD = svg.append('g')
      .attr('class', 'network-d')
      .attr('transform', 'translate(0, ' + (nodeMargin * 4 + nodeSizeD + (networkMargin * 2) + (audioHeight + nodeSizeD) ) + ')');

    networkD.append('rect')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', nodeSizeD + 2 * nodeMargin)
      .attr('rx', nodeMargin * 0.7)
      .attr('ry', nodeMargin * 0.7);

    let cellD = networkD.selectAll('.cell')
      .data(labelsD)
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', function(d, i) { return 'translate(' + xd(i) + ', ' + nodeMargin + ')'; })
      .on('mouseover', function(d, i) {
        onmouseoverD(d, i);
      })
      .on('mouseout', function() {
        onmouseout();
      });

    cellD.append('rect')
      .attr('class', 'shadow')
      .attr('transform', 'translate(1, 3)')
      .attr('width', nodeSizeD)
      .attr('height', nodeSizeD)
      .attr('rx', 4)
      .attr('ry', 4);

    cellD.append('rect')
      .attr('class', 'node')
      .attr('width', nodeSizeD)
      .attr('height', nodeSizeD)
      .attr('rx', 2)
      .attr('ry', 2);

    cellD.append('line')
      .attr('class', 'arrow')
      .attr('marker-end', 'url(#edgeArrowhead)')
      .attr('x1', nodeSizeD)
      .attr('x2', nodeSizeD + nodeMargin)
      .attr('y1', nodeSizeD / 2)
      .attr('y2', nodeSizeD / 2);
    /*
    cellD.append("line")
      .attr("class", "arrow")
      .attr("marker-end", "url(#edgeArrowhead)")
      .attr("transform", "translate(" + nodeSizeB / 2 + ", 0)")
      .attr("y1", 0)
      .attr("y2", -nodeMargin * 2);

    cellD.append("text")
      .attr("class", "label")
      .attr("dx", nodeSizeB / 2)
      .attr("dy", - nodeMargin * 2 - 15)
      .text(function(d) { return d; });
  */

    cellD.append('rect')
      .style('opacity', 0)
      .attr('transform', 'translate(-' + ((xd.step() - nodeSizeD) / 2) + ',-' + nodeMargin + ')')
      .attr('width', xd.step())
      .attr('height', networkHeightD + (networkMargin - networkHeightD) / 2);


    //
    // Links 2 (D - C)
    //
    let linkGroup2 = svg.append('g').attr('class', '.link-group-2')
      .attr('transform', 'translate(0, ' + (nodeMargin * 4 + nodeSizeD + networkMargin + (audioHeight + nodeSizeD) ) + ')');

    let linklink2 = linkGroup2.selectAll('.link')
      .data(linkData2)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', linkC_D)
      .style('opacity', function(d) { return d.v; });

    console.log(linklink1);
    console.log(linklink2);
  }
}
