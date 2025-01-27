import React from 'react';

import BaseData from "../../data/BaseData";
import Classification from '../../data/Classification';
import { withNamespaces,WithNamespaces } from 'react-i18next';
import i18n from './../../i18n/i18nClient';
import { TFunction } from "i18next";

export interface ILegendTimelineProps extends WithNamespaces{
    basedata: BaseData;
    yearsSelected: string[];

}

// export default 
class LegendTimeline extends React.Component<ILegendTimelineProps> {
	private stroke_color = '#4d4d4d';
	private box_size = 20;
	private label_offset = 15;

	constructor(props: ILegendTimelineProps) {
		super(props);
	}

	public render(): JSX.Element {
		return this.createLegend();
	}

	private createLegend(): JSX.Element {
		const {t}:any = this.props ;
		const classification = this.props.basedata.getClassification();

		let timelinePositiveColors = classification.getZeitreihenPositiveColors();
		let timelineNegativeColors = classification.getZeitreihenNegativeColors();

		const wegzug = this.createBox(timelineNegativeColors[0], 2, 0, "wegzug")
		const zuzug = this.createBox(timelinePositiveColors[0], 171, 0, "zuzug") //121
		const negative_circle = this.createCircle(timelineNegativeColors[1], 2 + this.box_size/2, this.box_size + 5+ this.box_size/2 )
		const positive_circle = this.createCircle(timelinePositiveColors[1], 171 + this.box_size/2, this.box_size + 5+ this.box_size/2 )//121
		const wegzugLabel = this.createLabel(' - ' + t('legend.outMovement'), this.box_size + 7,  this.label_offset, 'wegzugLabel');
		// const wegzugLabel = this.createLabel(' - Wegzug', this.box_size + 7,  this.label_offset, 'wegzugLabel');
		const zuzugLabel = this.createLabel(' - ' + t('legend.inMovement'), this.box_size + 176, this.label_offset, 'zuzugLabel'); //126
		// const zuzugLabel = this.createLabel(' - Zuzug', this.box_size + 126, this.label_offset, 'zuzugLabel');
		const positiveSaldiLabel = this.createLabel(' - ' + t('legend.positiveSaldi'), this.box_size + 176, this.box_size + 5 + this.label_offset, 'positiveSaldiLabel');//126
		// const positiveSaldiLabel = this.createLabel(' - positive Saldi ', this.box_size + 126, this.box_size + 5 + this.label_offset, 'positiveSaldiLabel');
		const negativeSaldiLabel = this.createLabel(' - ' + t('legend.negativeSaldi'), this.box_size + 7, this.box_size + 5 + this.label_offset, 'negativeSaldiLabel');
		// const negativeSaldiLabel = this.createLabel(' - negative Saldi ', this.box_size + 7, this.box_size + 5 + this.label_offset, 'negativeSaldiLabel');


		
		return (
			//width={300} 
			<div>
				<h4>{this.createLegendTitle(classification)}</h4>
				<svg key="legend" width={400} height={3*this.box_size } style={{ display: 'block' }}>
					{' '}
					{zuzug}
					{zuzugLabel}		
					{positive_circle}
					{positiveSaldiLabel}
					{wegzug}
					{wegzugLabel}
					{negative_circle}
					{negativeSaldiLabel}
				</svg>
			</div>
		);
	}



	private createLegendTitle(classification: Classification): string {
		const {t}:any = this.props ;
		let title = t('legend.titleTimeline');
		// let title = 'Zeitreihen';
		const location = classification.getLocation();
		const theme = classification.getTheme();
		if (location && theme) {
			title +=  t('legend.for');
			// title += ' für ';

            title += location;
			title += " (";
			let first: boolean = true;
			for (let year of this.props.yearsSelected) {
				if (!first) title += ", ";
				title += year;
				first = false;
			}
			title += ")";
		}
		return title;
	}

	private createBox(color: string, x: number, y: number, index: string): object {
		return (
			<rect
				key={'box-' + color + '-' + index}
				fill={color}
				stroke={this.stroke_color}
				width={index === 'neutral' ? this.box_size * 0.5 : this.box_size}
				height={this.box_size}
				x={x}
				y={y}
			></rect>
		);
	}

	private createCircle(color: string, x: number, y: number): object {
		return (
			<circle 
			key={'circle-' + color }
			cx={x} cy={y} r={this.box_size/2} fill={color}
			stroke={this.stroke_color}
			
			></circle>
			
		);
	}



	// Open Sans - font as in other elements
	private createLabel(label: string, x: number, y: number, index: string): object {
		return (
			<text key={'label-' + label + '-' + index} x={x} y={y} style={{ font: '13px Open Sans' }}>
				{/* { font: '10px sans-serif' } */}
				{label}
			</text>
		);
	}

	
}
export default withNamespaces()(LegendTimeline);
