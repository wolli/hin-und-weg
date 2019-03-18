
import { Checkbox } from "primereact/checkbox";
import { Panel } from "primereact/panel";
import { ScrollPanel } from "primereact/scrollpanel";
import { TabPanel, TabView } from "primereact/tabview";

import R from "ramda";
import React from "react";

import Geodata from "../model/Geodata";

import ChartsView from "./charts/ChartsView";
import ConfigurationView from "./ConfigurationView";
import GeodataView from "./geo/GeodataView";
import QueryView from "./QueryView";
import Themes from "./Themes";
import Years from "./Years";

export interface IAppProps {
    db: alaSQLSpace.AlaSQL;
}

interface IAppState {
    geodata: Geodata | null;
    yearsAvailable: string[];
    years: string[];
    query: string;
    theme: string;
}

export default class App extends React.Component<IAppProps, IAppState> {

    constructor(props: IAppProps) {
        super(props);
        this.state = {
            geodata: null,
            query: "SELECT * FROM matrices;",
            theme: "Von",
            years: [],
            yearsAvailable: [],
        };
    }

    public render(): JSX.Element {
        return (
            <div className="p-grid">
                <Panel header="Status" className="p-col-12">
                </Panel>
                <div className="p-col-2">
                    <div className="p-grid p-justify-around">
                        <Themes themes={["Von", "Nach", "Saldi"]} 
                                selected={ this.state.theme} setTheme={(newTheme) => this.setState({ theme: newTheme})}/>
                        <Years availableYears={this.state.yearsAvailable} selected={this.state.years}
                               setYears={(newYears) => this.setState({years: newYears})}/>
                    </div>
                </div>
                <TabView className="p-col-10 p-tabview-right" activeIndex={3}>
                    <TabPanel header="Karte">
                        <ScrollPanel style={{width: "100%", height: "850px"}}>
                            <GeodataView geodata={this.state.geodata}/>
                        </ScrollPanel>
                    </TabPanel>
                    <TabPanel header="Tabelle">
                        <QueryView db={this.props.db}/>
                    </TabPanel>
                    <TabPanel header="Diagramme">
                        <ChartsView items={[]}/>
                    </TabPanel>
                    <TabPanel header="Verwaltung">
                        <ConfigurationView db={this.props.db} geodata={this.state.geodata}
                                           addYear={(year) => {
                                               this.setState({ yearsAvailable: R.uniq(R.append(year, this.state.yearsAvailable )) });
                                            }}
                                           setGeodata={(newGeodata) => { this.setState({geodata: newGeodata}); }} />
                    </TabPanel>
                </TabView>
            </div>
        );
    }
}
