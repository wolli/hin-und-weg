import * as React from "react";
import {Slider as Slider} from "primereact/slider";
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';

import BaseData from '../../data/BaseData';


import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
import { select } from 'd3-selection';
import R from "ramda";
import Classification from '../../data/Classification';
import Legend from "../elements/Legend";

export interface ID3SankeyItem
{
   Von: string;
   Nach: string;
   Wert: number;
  Absolutwert: number;
}

export interface ID3SankeyProps {
   basedata: BaseData;
   data: ID3SankeyItem[];
    theme: string;
    jahr?: string;
    width: number;
    height?: number;
    vizID: number;
    baseViewId: number;
   yearsSelected: string[];
   dataProcessing:string;

}
interface ID3SankeyState
{
  threshold: number;
  rangeValue1: number;
  rangeValue2: number;
  rangeValues: [number, number],
  checked: boolean,
  checkedLabel: boolean,
  checkedNoFilter: boolean,
}

interface SNodeExtra {
    nodeId: number;
    name: string;
    negative: number;
}

interface SLinkExtra {
    source: number;
    target: number;
    value: number;
    negative: number |undefined;
}
type SNode = d3Sankey.SankeyNode<SNodeExtra, SLinkExtra>;
type SLink = d3Sankey.SankeyLink<SNodeExtra, SLinkExtra>;

interface DAG {
    nodes: SNode[];
    links: SLink[];
}


export class D3Sankey extends React.Component <ID3SankeyProps, ID3SankeyState> {
    private svgRef?: SVGElement | null;
    private svgID?: string;
    private heightResponsive?: number;
    



    constructor(props: ID3SankeyProps)
   {
      super(props);
    this.state = {
      threshold: 0,
      rangeValue1: 0,
      rangeValue2: 0,
      rangeValues: [0, 0],
      checked: false,
      checkedLabel: false,
      checkedNoFilter: false,
    }
  }

    public componentDidMount() {
      this.svgID = this.setSvgId(this.props.vizID, this.props.baseViewId)
  
      const [min, max] = this.getMinMax2();
      let wanderungsRate: boolean = (this.props.dataProcessing === "wanderungsrate") || (this.props.dataProcessing === "ratevon") || (this.props.dataProcessing === "ratenach");
      let normalizedData:ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert) >= this.state.threshold   , this.props.data); //   

      let data1 :ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert) <= this.state.rangeValues[0] && (wanderungsRate ? item.Wert*1000 : item.Wert) >= min   , this.props.data) ;
      let data2 :ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert) >= this.state.rangeValues[1] && (wanderungsRate ? item.Wert*1000 : item.Wert) <= max, this.props.data);
      let dataFilterSmall: ID3SankeyItem[] = R.concat(data1, data2);
      let dataFilterLarge :ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert) >= this.state.rangeValues[0] && (wanderungsRate ? item.Wert*1000 : item.Wert) <= this.state.rangeValues[1]   , this.props.data);
      let dataSaldi = (this.state.checked === false) ? dataFilterLarge :dataFilterSmall ;
      let data =  (this.props.theme == "Saldi") ? dataSaldi : normalizedData

      if (data) {this.drawSankeyChart(data, this.props.theme)}
      }

      public shouldComponentUpdate (nextProps: ID3SankeyProps, nextState: ID3SankeyState) {

        return  nextProps.data !== null || nextProps.data !== undefined  || nextProps.data !== this.props.data || nextProps.theme !== this.props.theme || nextState.threshold !==this.state.threshold  || nextState.rangeValues !==this.state.rangeValues || nextState.checkedNoFilter !== this.state.checkedNoFilter || nextState.checked !== this.state.checked || nextProps.width !== this.props.width
        // || nextProps.height !== this.props.height
        }

        public componentDidUpdate(){
          const [min, max] = this.getMinMax2();
          let wanderungsRate: boolean = (this.props.dataProcessing === "wanderungsrate") || (this.props.dataProcessing === "ratevon") || (this.props.dataProcessing === "ratenach");
    
          let threshold: number = this.state.checkedNoFilter ? min:  this.calculateCurrentThreshold();
          let rangeValues: [number, number] = this.state.checkedNoFilter ? [min, max]:  this.getInitialValuesSliderSaldi();
          let normalizedData:ID3SankeyItem[] = R.filter((item) =>  (wanderungsRate ? item.Wert*1000 : item.Wert)   >= threshold   , this.props.data);
          let data1 :ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert)  <= rangeValues[0] && (wanderungsRate ? item.Wert*1000 : item.Wert)  >= min   , this.props.data);
          let data2 :ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert)  >= rangeValues[1] && (wanderungsRate ? item.Wert*1000 : item.Wert)  <= max, this.props.data);
          let dataFilterSmall: ID3SankeyItem[] = R.concat(data1, data2);
          let dataFilterLarge :ID3SankeyItem[] = R.filter((item) => (wanderungsRate ? item.Wert*1000 : item.Wert)  >= rangeValues[0] && (wanderungsRate ? item.Wert*1000 : item.Wert)  <= rangeValues[1]   , this.props.data);
          let dataSaldi = (this.state.checked === false) ? dataFilterLarge :dataFilterSmall ;
          let data =  (this.props.theme == "Saldi") ? dataSaldi : normalizedData

          this.removePreviousChart(this.svgID);
          this.drawSankeyChart(data, this.props.theme);
        }


        private setSvgId(vizId: number, BVId: number){
          let svgID = 'Sankey' + vizId + BVId;
          return svgID;
        }

        private  removePreviousChart(id: string | undefined){
          if (typeof(id) === 'string') {
            const chart = document.getElementById(id);
            if (chart) {
              while(chart.hasChildNodes())
              if (chart.lastChild) {
                chart.removeChild(chart.lastChild);
              }
            }
          }
        }

        // DRAW D3 CHART
        private drawSankeyChart (data: ID3SankeyItem[], theme: string) {
          const svg = select(this.svgRef!);
          let nach = data.map(d => d.Nach);
          let von = data.map(d => d.Von);
          let names = nach.concat(von);
          let maxNameLength = Math.max(...names.map(el => el ? el.length : 50));
          this.heightResponsive = (data.length <= 10 )? 400 : (data.length >10 && data.length <= 15) ? 500 : (data.length > 15 && data.length <= 25) ? 600 : (data.length > 25 && data.length < 30) ? 700 : 1100;

          let marginResponsive : number =  maxNameLength > 3 ? maxNameLength*9 : maxNameLength*15; // this.props.width < 600 ? 35 : 100;
          // let marginResponsivePrevious : number =  this.props.width < 600 ? 35 : 100;

          let MARGIN = {TOP: 10, RIGHT: marginResponsive, BOTTOM: 10, LEFT: marginResponsive}
          let WIDTH = this.props.width - MARGIN.LEFT - MARGIN.RIGHT;
          let HEIGHT = this.heightResponsive - MARGIN.TOP - MARGIN.BOTTOM;

          // const colorsBlue = ["#92c5de", "#2166ac","#4393c3"]
          // const colorsRed = ["#b2182b", "#f4a582", "#d6604d"]
          // const colorsBlueRed = ["#92c5de","#f4a582","#4e525c"]
          const neutralcolor = "#f7f7f7"
          const bordercolor = "#525252"

          const classification = this.props.basedata.getClassification();

          let classColors = (data: ID3SankeyItem[]) => {
              let colors = new Array(data.length);
                colors.fill('#000000');
              for(let i=0;i<data.length;i++)
              {
                colors[i]=classification.getColor(data[i])
              }  return colors
          }
          let hexcolor:string[]  = classColors(data);

          let hexcolorAdd: string[] =  classColors(data);
          hexcolorAdd.push("#f7f7f7");
          svg.append("svg")
          .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
          .attr("height", HEIGHT)

          let chart = svg.append("g")
            .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)
            .attr("id", "chartArea")

          // let nach = data.map(d => d["Nach"]);
          // let von = data.map(d => d["Von"]);
          if (von.length > 0 && nach.length > 0 )
          {
            let checkIndx = (ar1:string[], ar2:string[])=> {
              for(let i=0;i<ar1.length;i++){
                if (ar1[i] === ar2[i] ){
                  return i
                }
              }
             }

          let values =data.map(d=> d.Wert);
          let indx = checkIndx(von, nach)

          let maxIdx: any = d3.max(data, (d,i) => { if (d) return i})
         
          // let colorsFunction = (x:any, clrs:string[] )=> {
          //     let arrCol = new Array((indx !== undefined)? x+1 : x+2);
          //     arrCol.fill(clrs[0]);
          //     if (typeof(indx) === "number"){
          //       arrCol[indx] =clrs[1]
          //       arrCol[arrCol.length-1] = clrs [1]
          //     } else {
          //       arrCol[arrCol.length - 2] = clrs [1]
          //       arrCol[arrCol.length - 1] = clrs [1]
          //     } return arrCol
          //   }

          // let colorsVon:string[] = colorsFunction(nach.length, colorsBlue)
          // let colorsNach:string[] = colorsFunction(von.length, colorsRed)

          if (theme === "Von")
          {
            let nodesAr = data.map((d,i) => ({
              nodeId: i,
              name: d["Nach"],
              negative: +d.Wert
            }))
            let nameSource = von[0]
            let valueSource = ()=> {
              // return (typeof(indx) === "number")? values[indx] : NaN

              return (typeof(indx) === "number")? values[indx] : 0
            }
            let nodeVon = {
              nodeId: +(maxIdx+1),
              name: nameSource,
              negative: +valueSource
            }

            nodesAr.push( nodeVon)

            let nodesArPlus = data.map((d,i) => ({
              nodeId: i,
              name: d["Nach"],
              negative: +d.Wert
            }))

            let nodeVonZero = {
              nodeId: +(maxIdx+2),
              name: nameSource,
              negative:   typeof(indx) !== "number" ? NaN : 0
            }

            nodesArPlus.push(nodeVon, nodeVonZero)


            let vonValues = data.map( d => +d.Wert);
            let vonSum = vonValues.reduce(function(a, b) { return a + b; }, 0);

            let linksF = (dat:any) => {
                let l
                l = dat.map((d:any, i:number) => ({
                    source: +(maxIdx+1),
                    target: +i,
                    value: +d.Wert,
                    negative: +d.Wert
                }))
                return l
              }

            let linkVonZero = {
              source: +(maxIdx+1),
              target: +(maxIdx+2),
              value: 0,
              negative: 0
            }

            let linksAr = linksF(data);
            let linksArPlus = linksF(data);
            linksArPlus.push(linkVonZero);

            const dataSankey:DAG = (indx === undefined)? {
              "nodes" : nodesArPlus,
              "links": linksArPlus
            } :
            {
                "nodes" : nodesAr,
                "links": linksAr
            }

            let sankey = d3Sankey.sankey()
            .nodeWidth(24)
            .nodePadding(12)
            .extent([[1, 1], [WIDTH - 1 , HEIGHT - 6 ]]);


            let link:any = chart.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .selectAll("path");

            let node:any = chart.append("g")
            .attr("class", "nodes")
            .attr("font-family", "sans-serif")
            .attr("font-size", 13)
            .selectAll("g");


            sankey(dataSankey);

            link = link
              .data(dataSankey.links)
              .enter().append("path")
              .attr("d", d3Sankey.sankeyLinkHorizontal())
              .attr("stroke-width", function (d: any) { return d.negative === 0 ? 0 : Math.max(1, d.width); })
              .style("stroke", function(d:any,i:number){ return d.negative === 0 ? bordercolor : hexcolor[i]})
              // .style("stroke", colorsBlue[2])
              .on('mouseover', function() {
                  d3.select(d3.event.currentTarget).style('stroke-opacity', 0.9);
                })
              .on('mouseout', function() {
                  d3.select(d3.event.currentTarget).style('stroke-opacity', 0.5);
                });;

            link.append("title")
              .text(function (d: any) { return d.source.name + " → " + d.target.name + "\n" + d.value; });

            node = node
              .data(dataSankey.nodes)
              .enter().append("g");

            node.append("rect")
              .attr("x", function (d: any) { return d.x0; })
              .attr("y", function (d: any) { return d.y0; })
              .attr("height", function (d: any) { return d.y1 - d.y0 === 0 ? 2 : d.y1 - d.y0; })
              .attr("width", function (d: any) { return d.x1 - d.x0; })
              .attr("fill", function (d: any) { return hexcolorAdd[d.index] })
              // .attr("fill", function (d: any) { return colorsVon[d.index] })
              .style("stroke", function(d:any, i:number) { let col:any = d3.rgb(hexcolor[i]); return col.darker(); })
              // .style("stroke", function(d:any) { let col:any = d3.rgb(colorsBlue[1]); return col.darker(); })
              .style("stroke-width", 2)
              .on("mouseover", function(d:any) {
                  link
                    .filter(function(dd:any, i:number) { return dd.source.name !== dataSankey.nodes[i].name && dd.target.name !== dataSankey.nodes[i].name })
                    .selectAll("path")
                    .transition()
                      .style('opacity', 0.1);
                  // fade other groups
                  node
                    .filter(function(dd:any, i:number) { return dd.name !== dataSankey.nodes[i].name })
                    .selectAll("rect")
                    .transition()
                      .style("opacity", 0.1);
                })
              .on("mouseout", function(d:any) {
                  link.selectAll("path")
                    .transition()
                      .style('opacity', 1);
                  // unfade groups
                  node.selectAll("rect")
                    .transition()
                      .style("opacity", 1);
                });

              let names = node //.filter(function(d:any) { return d.value != 0; })
              .append("text")
              .attr("x", function (d: any) { return d.x0 + 30; }) // -6
              .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
              .attr("dy", "0.35em")
              .attr("text-anchor", "start") // "end"
              .text(function (d: any) { return d.name; })
              .filter(function (d: any) { return d.x0 < WIDTH / 2; })
              .attr("x", function (d: any) { return d.x0 - 6; }) // d.x1 + 6
              .attr("text-anchor", "end"); // "start"

              if (this.state.checkedLabel === true) {
                let valuesLabel =  node //.filter(function(d:any) { return d.value != 0; })
             .filter(function (d: any) { return d.x0 > WIDTH / 2; })
             .append("text")
             .attr("x", function (d: any) { return   d.x0 - 6; }) // + 30
             .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
             .attr("dy", "0.35em")
             .attr("text-anchor", "end") // "start"
             .text(function (d: any) { return  Math.round((d.negative + Number.EPSILON) * 1000) / 1000; })


             let sumLabel =  node //.filter(function(d:any) { return d.value != 0; })
             .filter(function (d: any) { return d.x0 < WIDTH / 2; })
             .append("text")
             .attr("x", function (d: any) { return   d.x1 + 6; }) // d.x0 -6
             .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
             .attr("dy", "0.35em")
             .attr("text-anchor", "start") // "end"
             .text(Math.round((vonSum + Number.EPSILON) * 1000) / 1000 )


             }

            node.append("title")
              .text(function (d: any) { return d.name + "\n" + Math.round((d.negative + Number.EPSILON) * 1000) / 1000 ; });

          }
          else if (theme === "Nach")
          {

          let nodesAr = data.map((d,i) => ({
              nodeId: i,
              name: d["Von"],
              negative: +d.Wert
          }))

          let nameTarget = nach[0]
          let valueTarget = ()=> {
            if (typeof(indx) === "number")
            {return values[indx]}
          }

          let nodeNach = {
              nodeId: +(maxIdx+1),
              name: nameTarget,
              negative: +valueTarget
          }
          nodesAr.push(nodeNach)

          let nodesArPlus = data.map((d,i) => ({
              nodeId: i,
              name: d["Von"],
              negative: +d.Wert
          }))

            let nodeNachZero = {
              nodeId: +(maxIdx+2),
              name: nameTarget,
              negative: typeof(indx) !== "number" ? NaN : 0
          }
          nodesArPlus.push(nodeNach, nodeNachZero)

          let nachValues = data.map( d => +d.Wert);
          let nachSum = nachValues.reduce(function(a, b) { return a + b; }, 0);

          let linksF = (dat:any) => {
              let l
              l = dat.map((d:any, i:number) => ({
                  target: +(maxIdx+1),
                  source: +i,
                  value: +d.Wert,
                  negative: +d.Wert
              }))
              return l
          }

          let linkNachZero = {
            source: +(maxIdx+2),
            target: +(maxIdx+1),
            value: 0,
            negative: 0
          }

          let linksAr = linksF(data);
          let linksArPlus = linksF(data);
          linksArPlus.push(linkNachZero);

          const dataSankey:DAG = (indx === undefined)? {
            "nodes" : nodesArPlus,
            "links": linksArPlus
          } :
          {
              "nodes" : nodesAr,
              "links": linksAr
          }

          let sankey = d3Sankey.sankey()
          .nodeWidth(24)
          .nodePadding(12)
          .extent([[1, 1], [WIDTH - 1 , HEIGHT - 6 ]]);

          let link:any = chart.append("g")
          .attr("class", "links")
          .attr("fill", "none")
          .attr("stroke-opacity", 0.7) //0.5
          .selectAll("path");

          let node:any = chart.append("g")
          .attr("class", "nodes")
          .attr("font-family", "sans-serif")
          .attr("font-size", 13)
          .selectAll("g");

          sankey(dataSankey);

          link = link
            .data(dataSankey.links)
            .enter().append("path")
            .attr("d", d3Sankey.sankeyLinkHorizontal())
            .attr("stroke-width", function (d: any) { return d.negative === 0 ? 0 : Math.max(1, d.width); })
            .style("stroke", function(d:any,i:number){ return d.negative === 0 ? bordercolor : hexcolor[i]})


            // .style("stroke", colorsRed[2])
            .on('mouseover', function() {
                d3.select(d3.event.currentTarget).style('stroke-opacity', 0.9);
              })
            .on('mouseout', function() {
                d3.select(d3.event.currentTarget).style('stroke-opacity', 0.7);
              });;

          link.append("title")
            .text(function (d: any) { return d.source.name + " → " + d.target.name + "\n" + d.value; });

          node = node
            .data(dataSankey.nodes)
            .enter().append("g");

          node.append("rect")
            .attr("x", function (d: any) { return d.x0; })
            .attr("y", function (d: any) { return d.y0; })
            .attr("height", function (d: any) { return d.y1 - d.y0 === 0 ? 2 :  d.y1 - d.y0; })
            .attr("width", function (d: any) { return d.x1 - d.x0; })
            // .attr("fill", function (d: any) { return colorsNach[d.index] })
            .attr("fill", function (d: any) { return hexcolorAdd[d.index] })
            .style("stroke", function(d:any, i:number) { let col:any = d3.rgb(hexcolor[i]); return col.darker(); })

            // .style("stroke", function(d:any) { let col:any = d3.rgb(colorsRed[0]); return col.darker(); })
            .style("stroke-width", 2)
            .on("mouseover", function(d:any) {
                link
                  .filter(function(dd:any, i:number) { return dd.source.name !== dataSankey.nodes[i].name && dd.target.name !== dataSankey.nodes[i].name })
                  .selectAll("path")
                  .transition()
                    .style('opacity', 0.1);
                node
                  .filter(function(dd:any, i:number) { return dd.name !== dataSankey.nodes[i].name })
                  .selectAll("rect")
                  .transition()
                    .style("opacity", 0.1);
              })
            .on("mouseout", function(d:any) {
                link.selectAll("path")
                  .transition()
                    .style('opacity', 1);
                node.selectAll("rect")
                  .transition()
                    .style("opacity", 1);
              });

        //  let names =  node.filter(function(d:any) { return d.value != 0; })
          let names =  node.append("text")
            .attr("x", function (d: any) { return d.x0 + 30; }) // d.x0 - 6
            .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em") //0.35
            .attr("text-anchor", "start" ) //"end"
            .text(function (d: any) { return d.name; })
            .filter(function (d: any) { return d.x0 < WIDTH / 2; })
            .attr("x", function (d: any) { return d.x0 - 6; }) //d.x1 + 6
            .attr("text-anchor", "end"); //"start")

            if (this.state.checkedLabel === true) {
              // let valuesLabel =  node.filter(function(d:any) { return d.value != 0; })
              let valuesLabel =  node.filter(function (d: any) { return d.x0 > WIDTH / 2; })
           .append("text")
           .attr("x", function (d: any) { return   d.x0 - 6; }) // + 30
           .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
           .attr("dy", "0.35em")
           .attr("text-anchor", "end") // "start"
           .text( Math.round((nachSum + Number.EPSILON) * 1000) / 1000 )


          //  let sumLabel =  node.filter(function(d:any) { return d.value != 0; })
           let sumLabel =  node.filter(function (d: any) { return d.x0 < WIDTH / 2; })
           .append("text")
           .attr("x", function (d: any) { return   d.x1 + 6; }) // d.x0 -6
           .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
           .attr("dy", "0.35em")
           .attr("text-anchor", "start") // " end"
           .text(function (d: any) { return  Math.round((d.negative + Number.EPSILON) * 1000) / 1000; })


           }
          node.append("title")
            .text(function (d: any) { return d.name + "\n" +  Math.round((d.negative + Number.EPSILON) * 1000) / 1000; });

          }
          else if (theme == "Saldi") {

          let nodesAr = data.map((d,i) => ({
              nodeId: i,
              name: d["Von"],
              negative: +d.Wert
          }))

          let nameSource = nach[0]
          let valueTarget = ()=> {
            // if (typeof(indx) === "number") {return  values[indx]}
              return (typeof(indx) === "number") ? values[indx] : NaN
            }
          if ((typeof(indx) !== "number")){
            let nodeNachNaN = {
            nodeId: +(maxIdx+1),
            name: nameSource,
            negative: NaN
            }
            nodesAr.push(nodeNachNaN)
          }

          let nodeNach = {
              nodeId: +((typeof(indx) === "number") ? maxIdx+1 : maxIdx+2),
              name: nameSource,
              negative: +valueTarget
          }

          nodesAr.push(nodeNach)

          let arrAbsolute = (ar:any[]) => { for(let i=0;i< ar.length;i++){
            if (ar[i] < 0 ){
                  ar[i] = Math.abs(ar[i])
                }
              } return ar
            }

          // let negativeIdx = (ar:any[]) => {
          //     let idx: number[] = new Array(0)
          //     for(let i=0;i<ar.length;i++) {
          //       if (ar[i] < 0 ){
          //         idx[i] = 0
          //       } else {
          //         idx[i] = 1
          //       }
          //     }return idx
          //   }

          let absValues = arrAbsolute(values)
          let vonValues = data.map( d => +d.Wert);
          let vonSum = vonValues.reduce(function(a, b) { return a + b; }, 0);

          let linksF = (dat:any) => {
              let l
              l = dat.map((d:any, i:number) => ({
                  source: +(maxIdx+1),
                  target: +i,
                  value: absValues[i],
                  negative: +d.Wert
              }))
              return l
            }


          let linksAr = linksF(data);

          const dataSankey:DAG = {
              "nodes" : nodesAr,
              "links": linksAr
          }

          let sankey = d3Sankey.sankey()
          .nodeWidth(24)
          .nodePadding(12)
          .extent([[1, 1], [WIDTH - 1 , HEIGHT - 6 ]]);


          let link:any = chart.append("g")
          .attr("class", "links")
          .attr("fill", "none")
          .attr("stroke-opacity", 0.5)
          .selectAll("path");

          let node:any = chart.append("g")
          .attr("class", "nodes")
          .attr("font-family", "sans-serif")
          .attr("font-size", 13)
          .selectAll("g");


          sankey(dataSankey);

          link = link
            .data(dataSankey.links)
            .enter().append("path")
            .attr("d", d3Sankey.sankeyLinkHorizontal())
            .attr("stroke-width", function (d: any) { return d.negative === 0 ? 0 : Math.max(1, d.width); })
            .style("stroke", function(d:any,i:number){ return d.negative === 0 ? bordercolor : hexcolor[i]})
            // .style("stroke", function (d:any){return d.negative < 0 ? colorsBlueRed[0] : colorsBlueRed [1]})
            .on('mouseover', function() {
                d3.select(d3.event.currentTarget).style('stroke-opacity', 0.9);
              })
            .on('mouseout', function() {
                d3.select(d3.event.currentTarget).style('stroke-opacity', 0.5);
              });;

          link.append("title")
            .text(function (d: any) { return d.source.name + " → " + d.target.name + "\n" + d.negative; });

          node = node
            .data(dataSankey.nodes)
            .enter().append("g");

          node.append("rect")
            .attr("x", function (d: any) { return d.x0; })
            .attr("y", function (d: any) { return d.y0; })
            .attr("height", function (d: any) { return d.y1 - d.y0 === 0 ? 2 : d.y1 - d.y0; })
            .attr("width", function (d: any) { return d.x1 - d.x0; })
            .attr("fill", function (d: any) { return hexcolorAdd[d.index] })
            // .attr("fill", function (d: any, i: number) {return d.negative === 0  || i === maxIdx+1 ? colorsBlueRed[2]: d.negative < 0 ? colorsBlueRed[0] : colorsBlueRed [1] })
            .style("stroke", function(d:any, i:number) { let col:any = d3.rgb( hexcolorAdd[i]); return col.darker(); })
            // .style("stroke", function(d:any) { let col:any = d3.rgb(colorsBlue[1]); return col.darker(); })
            .style("stroke-width", 2)
            .on("mouseover", function(d:any) {
                link
                  .filter(function(dd:any, i:number) { return dd.source.name !== dataSankey.nodes[i].name && dd.target.name !== dataSankey.nodes[i].name })
                  .selectAll("path")
                  .transition()
                    .style('opacity', 0.1);
                node
                  .filter(function(dd:any, i:number) { return dd.name !== dataSankey.nodes[i].name })
                  .selectAll("rect")
                  .transition()
                    .style("opacity", 0.1);
              })
            .on("mouseout", function(d:any) {
                link.selectAll("path")
                  .transition()
                    .style('opacity', 1);
                node.selectAll("rect")
                  .transition()
                    .style("opacity", 1);
              });

          // node.filter(function(d:any) { return d.value != 0; })
         let names =  node.append("text")
            .attr("x", function (d: any) { return d.x0 + 30; }) // -6
            .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em") //0.35
            .attr("text-anchor", "start") //"end"
            .text(function (d: any) { return d.name; })
            .filter(function (d: any) { return d.x0 < WIDTH / 2; })
            .attr("x", function (d: any) { return d.x0 - 6; }) // d.x1 + 6
            .attr("text-anchor", "end"); // "start"

            if (this.state.checkedLabel === true) {
              // let valuesLabel =  node.filter(function(d:any) { return d.value != 0; })
              let valuesLabel =  node.filter(function (d: any) { return d.x0 > WIDTH / 2; })
           .append("text")
           .attr("x", function (d: any) { return   d.x0 - 6; }) // +30
           .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
           .attr("dy", "0.35em")
           .attr("text-anchor", "end") //"start"
           .text(function (d: any) { return Math.round((d.negative + Number.EPSILON) * 1000) / 1000; })


           let sumLabel =  node.filter(function(d:any) { return d.value != 0; })
           .filter(function (d: any) { return d.x0 < WIDTH / 2; })
           .append("text")
           .attr("x", function (d: any) { return   d.x0 + 30; }) // - 6
           .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
           .attr("dy", "0.35em")
           .attr("text-anchor", "start") // "end"
           .text(Math.round((vonSum + Number.EPSILON) * 1000) / 1000 )

           }

        node.append("title")
            .text(function (d: any) { console.log("node.title d: " + d); return d.index === maxIdx+1 ? d.name : d.name + "\n" + Math.round((d.negative + Number.EPSILON) * 1000) / 1000; });
          }
        }
      }


    private calculateCurrentThreshold(): number
    {
      let [min, max] = this.getMinMax2();
      let threshold: number = this.state.threshold;
      if (this.state.threshold == 0) threshold = min;
      if (this.state.threshold < min) threshold = min;
      if (this.state.threshold > max) threshold = max;

      return threshold;
    }

  //  private getMinMax(): [number, number]
  //  {
  //     let max = Number.MIN_VALUE;
  //     let second_max = Number.MIN_VALUE;
  //     let min = Number.MAX_VALUE;
  //     if (this.props.data)
  //     {
  //        for (let item of this.props.data)
  //        {
  //           if (item["Wert"] < min)
  //           {
  //              min = item["Wert"];
  //           }
  //           if (item["Wert"] > max)
  //           {
  //              if (max > second_max)
  //              {
  //                 second_max = max;
  //              }
  //              max = item["Wert"];
  //           }
  //           else if (item["Wert"] > second_max)
  //           {
  //              second_max = item["Wert"];
  //           }
  //        }
  //     }
  //     return [min, second_max + 1];
  // }

  private getMinMax2(): [number, number]
   {
      let max = Number.MIN_VALUE;
      let second_max = Number.MIN_VALUE;
      let min = Number.MAX_VALUE;
      if (this.props.data)
      {
         for (let item of this.props.data)
         {
            if (item["Wert"] < min)
            {
               min = item["Wert"];
            }
            if (item["Wert"] > max)
            {
               if (max > second_max)
               {
                  second_max = max;
               }
               max = item["Wert"];
            }
            else if (item["Wert"] > second_max)
            {
               second_max = item["Wert"];
            }
         }
      }
      let wanderungsRate: boolean = (this.props.dataProcessing === "wanderungsrate") || (this.props.dataProcessing === "ratevon") || (this.props.dataProcessing === "ratenach");
      min = wanderungsRate ? min * 1000 : min;
      max = wanderungsRate ? max * 1000 : max;
      return [min, max + 1];
  }

  private getInitialValuesSliderSaldi(): [number, number]
  {
    let [min, max] = this.getMinMax2();
    let rangeValues: [number, number] = this.state.rangeValues;
    if (this.state.rangeValues[0] == 0) rangeValues[0] = min;
    if (this.state.rangeValues[1] == 0) rangeValues[1] = max;
    if (this.state.rangeValues[0] < min) rangeValues[0] = min;
    if (this.state.rangeValues[0] > max) rangeValues[0] = min;
    if (this.state.rangeValues[1] < min) rangeValues[1] = max;
    if (this.state.rangeValues[1] > max) rangeValues[1] = max;
    if (this.state.rangeValues[0] > this.state.rangeValues[1]) rangeValues[1] = max , rangeValues[0] = min;
    return rangeValues;
  }

  public render() {
    const { width, height } = this.props;
    let [min, max] = this.getMinMax2();
        let threshold: number = this.state.checkedNoFilter ? min : this.calculateCurrentThreshold();
    let rangeValues: [number, number] = this.state.checkedNoFilter ? [min, max] : this.getInitialValuesSliderSaldi();
    // let saldiText: string = (this.state.checked === true)? ('ab ' + min + ' bis: ' + rangeValues[0] + '       und          ab: ' + rangeValues[1] + ' bis: ' + max) : ('ab ' + rangeValues[0] + ' bis: ' + rangeValues[1]);
    let rangeValue1: number = this.state.checkedNoFilter ? min : rangeValues[0];
    let rangeValue2: number = this.state.checkedNoFilter ? max : rangeValues[1];
    let wanderungsRate: boolean = (this.props.dataProcessing === "wanderungsrate") || (this.props.dataProcessing === "ratevon") || (this.props.dataProcessing === "ratenach");

    return (
      <div className="p-grid">

        <div className="p-col-6 noprint">
          <Checkbox
            onChange={(e: { value: any, checked: boolean }) => this.setState({checked: e.checked})}
            checked={this.state.checked}
            disabled= {(this.props.theme === 'Saldi') ? false : true}
          />
          <label className="p-checkbox-label">Umgekehrt filtern</label>
          </div>
          <div className="p-col-6 noprint">
            <Checkbox
              name = "saldiChordNoFilter"
              id	= "saldiChordNoFilter"
              onChange={(e: { value: any, checked: boolean }) => this.setState({checkedNoFilter: e.checked})}
              checked={this.state.checkedNoFilter}
            />
            <label className="p-checkbox-label">Kein Filter</label>
          </div>


            <div className="p-col-1 noprint" style={{ width: '3.5em' }}>{wanderungsRate ? min/1000 : min}</div>
            <div className="p-col-10 noprint">
        <div className={`banner ${ this.props.theme == "Saldi" ? this.state.checked === true ?  "slider-reversed" : "slider-saldi" : ""}`}>

                {
                    this.props.theme == "Saldi" ?
                    <Slider
                    disabled={this.state.checkedNoFilter   ? true : false}
                    min={min}
                    max={max}
                    value={this.state.checkedNoFilter ? [min, max] : rangeValues}
                    onChange={(e) => this.state.checkedNoFilter ? this.setState({rangeValues: [min, max  ]as [number, number]}) : this.setState({rangeValues: e.value as [number, number]})}
                    range={true} />
                    :
                    <Slider
                    disabled={this.state.checkedNoFilter ? true : false}
                    min={min}
                    max={max}
                    value={this.state.checkedNoFilter  ? min : threshold}
                    orientation="horizontal"
                    onChange={(e) => this.state.checkedNoFilter  ? this.setState({  threshold: min as number}) : this.setState({ threshold: e.value as number})}/>
                }
                </div>
                </div>
            <div className="p-col-1 noprint" style={{ width: '3.5em' }}>{wanderungsRate ? max/1000 : max}</div>
            {/* <div className="p-col-12 p-justify-center">{this.props.theme == "Saldi" ? 'Anzeige Werte in Bereich: ' + saldiText : 'Anzeige ab Wert: ' + threshold  }</div> */}
        <div className="p-col-2 noprint">
          {this.props.theme == "Saldi" ? this.state.checked ?
            'Anzeige Werte in Bereich: ab ' + wanderungsRate ? min/1000 : min + ' bis ' :
            'Anzeige Werte in Bereich: ab ' : 'Anzeige ab Wert: '}
            </div>
            <div className="p-col-2 noprint">
              {this.props.theme == "Saldi" ?
             <InputText
              value={wanderungsRate ? rangeValue1/1000 : rangeValue1 }
              style={{ width: '6em' }}
              type='number'
              onChange={(e:any) => this.state.checkedNoFilter ? this.setState({rangeValues: [min as number, rangeValue2]}) : this.setState({ rangeValues: [e.target.value as number, rangeValue2] })}
             />
            : <InputText
              value={this.state.checkedNoFilter ? wanderungsRate ? min/1000 : min : wanderungsRate ? threshold/1000 :threshold}
              style={{ width: '10em' }}
              type='number'
              onChange={(e:any) => this.state.checkedNoFilter ? this.setState({ threshold: min as number }) : this.setState({ threshold: e.target.value as number })}
            />
             }
             </div>
            <div className="p-col-2 noprint">{this.props.theme == "Saldi" ? this.state.checked === true?
              'und ab ' : 'bis ' : ' '}
            </div>
             <div className="p-col-2 noprint"> {this.props.theme == "Saldi" ?
              <InputText
                value={wanderungsRate ? rangeValue2/1000 : rangeValue2}
                style={{ width: '6em' }}
                type='number'
                onChange={(e:any) => this.state.checkedNoFilter ? this.setState({ rangeValues: [rangeValue1, max as number] }) : this.setState({ rangeValues: [rangeValue1, e.target.value as number] })}
              /> :
             <div className="p-col-2 p-offset-1"></div>}
             </div>
             <div className="p-col-2">{this.props.theme == "Saldi" && this.state.checked === true?
            'bis ' + wanderungsRate ? max/1000 : max : ' '} </div>
        <div className="p-col-12 p-md-12 p-lg-6">
               <Legend basedata={this.props.basedata} showCenter='' yearsSelected={this.props.yearsSelected} />
            </div>
        <div className="p-col-12 p-md-12 p-lg-6 noprint">
          <Checkbox
            onChange={(e: { value: any, checked: boolean }) => this.setState({checkedLabel: e.checked})}
            checked={this.state.checkedLabel}
            // disabled= {(this.props.theme === 'Saldi') ? false : true}
          />
          <label className="p-checkbox-label">Anzahl Umzüge anzeigen</label>
        </div>
        <div className="p-col-12" >
                <svg id={this.svgID} width={width} height={height} ref={ref => (this.svgRef = ref)} />
        </div>
         </div>

      );
    }

}

