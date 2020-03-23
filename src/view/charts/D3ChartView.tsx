import React from "react";
import ChartConfigView from "./ChartConfigView";
import { D3Chart, ID3ChartItem} from "./D3Chart";
import ContainerDimensions from 'react-container-dimensions';

export interface ID3ChartViewProps
{
	items: ID3ChartItem[];
	theme: string;
}



export default class ChartsView extends React.Component<ID3ChartViewProps>
{

	constructor(props: ID3ChartViewProps)
	{
		super(props);
		this.onChartTypeSelect = this.onChartTypeSelect.bind(this);
		
    }
    

	public render(): JSX.Element
	{
        
        

		return (
			<div className="p-grid">
				<div className="p-col-4">Bar Chart "Von"</div>
			
                
				<div id="chartDiv" className="p-col-12">
                    <ContainerDimensions>
                        { ({ width, height }) => 
                            <D3Chart width={width} height={this.props.items.length*50} data={this.props.items} theme={this.props.theme}/>
                        }
                    </ContainerDimensions>
					
				</div>
				
			</div>
		);
    }
    

	private onChartTypeSelect(selected: string)
	{
		this.setState({chartType: selected});
	}

}