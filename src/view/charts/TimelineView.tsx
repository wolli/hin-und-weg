import React from "react";

export interface ITimelineItem
{
	Ort: string;
	Jahr: string;
	Zuzug: number;
	Wegzug: number;
	Saldo: number;
}

export interface ITimelineViewProps
{
	data: ITimelineItem[];
}

export class TimelineView extends React.Component<ITimelineViewProps>
{

	private static idCounter: number = 0;
	// @ts-ignore
	private timeline: am4charts.Chart | null;
	private id: number;

	constructor(props: ITimelineViewProps)
	{
		super(props);
		this.timeline = null;
		TimelineView.idCounter++;
		this.id = TimelineView.idCounter;
	}

	public componentDidMount()
	{
		this.timeline = this.createTimeline();
	}

	public componentDidUpdate()
	{
		if (this.timeline)
		{
			this.timeline.dispose();
		}
		this.timeline = this.createTimeline();
	}

	public componentWillUnmount()
	{
		if (this.timeline)
		{
			this.timeline.dispose();
		}
	}

	public render(): JSX.Element
	{
		return (
			<div className="p-grid">
				<div className="p-col-12" id={"timeline-" + this.id} style={{ width: "100%", height: "800px" }}></div>
			</div>
		);
	}

	private createTimeline()
	{
		// @ts-ignore
		am4core.useTheme(am4themes_animated);
		// @ts-ignore
		let timeline = am4core.create("timeline-" + this.id, am4charts.XYChart);
		timeline.data = this.props.data;
		// @ts-ignore
		var categoryAxis = timeline.xAxes.push(new am4charts.CategoryAxis());
		categoryAxis.renderer.minGridDistance = 0;
		categoryAxis.dataFields.category = "Jahr";
		// @ts-ignore
		var valueAxis = timeline.yAxes.push(new am4charts.ValueAxis());
		// @ts-ignore
		var zuzug = timeline.series.push(new am4charts.ColumnSeries());
		zuzug.name = "Zuzug";
		zuzug.dataFields.categoryX = "Jahr";
		zuzug.dataFields.valueY = "Zuzug";
		zuzug.columns.template.tooltipText = "Zuzug nach {Ort} für {Jahr}: [bold]{Zuzug}[/]";
		zuzug.yAxis = valueAxis;
		zuzug.xAxis = categoryAxis;
		zuzug.clustered = false;
		zuzug.fill = "#fddbc7";
		// @ts-ignore
		var wegzug = timeline.series.push(new am4charts.ColumnSeries());
		wegzug.name = "Wegzug";
		wegzug.dataFields.categoryX = "Jahr";
		wegzug.dataFields.valueY = "Wegzug";
		wegzug.columns.template.tooltipText = "Wegzug von {Ort} für {Jahr}: [bold]{Wegzug}[/]";
		wegzug.yAxis = valueAxis;
		wegzug.xAxis = categoryAxis;
		wegzug.clustered = false;
		wegzug.fill = "#d1e5f0";
		// @ts-ignore
		var saldi = timeline.series.push(new am4charts.LineSeries());
		saldi.name = "Saldi";
		saldi.strokeWidth = 3;
		saldi.stroke = "#000000";
		saldi.dataFields.categoryX = "Jahr";
		saldi.dataFields.valueY = "Saldo";
		saldi.tooltipText = "Saldo in {Ort} für {Jahr}: [bold]{Saldo}[/]";
		saldi.yAxis = valueAxis;
		saldi.xAxis = categoryAxis;
		saldi.clustered = false;
		// @ts-ignore
		var bullet = saldi.bullets.push(new am4charts.CircleBullet());
		// @ts-ignore
		timeline.cursor = new am4charts.XYCursor();
		timeline.cursor.lineX.strokeOpacity = 0.1;
		timeline.cursor.lineY.strokeOpacity = 0.1;
		return timeline;
	}

}
