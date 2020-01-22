import { app, Menu } from "electron";
import Config from "./config";

export default class MainMenu
{

	private static template: Electron.MenuItemConstructorOptions[] =
	[
		{
			label: 'Anwendung',
			submenu:
			[
				{
					label: 'Projekt öffnen'
				},
				{
					label: 'Projekt speichern'
				},
				{
					label: 'Import'
				},
				{
					label: 'Export'
				},
				{
					type: 'separator'
				},
				{
					label: 'Beenden',
					role: 'quit'
				}
			]
		},
		{
			label: 'Visualisierungen',
			submenu:
			[
				{
					label: 'Karte'
				},
				{
					label: 'Tabelle'
				},
				{
					label: 'Zeitreihen'
				},
				{
					label: 'Diagramm',
					submenu:
					[
						{
							label: 'Chord'
						},
						{
							label: 'Sankey'
						},
						{
							label: 'Balken'
						},
					]
				}
			]
		},
		{
			label: 'Analysen',
			submenu:
			[
				{
					label: 'Statistiken',
					submenu:
					[
						{
							label: 'Mittelwert'
						},
						{
							label: 'Median'
						},
						{
							label: 'Standardabweichung'
						},
						{
							label: 'Mode'
						}
					]
				},
				{
					label: 'räumliche Aggregation',
					submenu:
					[
						{
							label: 'Flächen auswählen'
						},
						{
							label: 'Aggregation'
						},
						{
							label: 'Aggregation zurücknehmen'
						},
						{
							label: 'Aggregation als CSV exportieren'
						}
					]
				},
				{
					label: 'Datenbank'
				}
			]
		},
		{
			label: 'Einstellungen',
			submenu:
			[
				{
					label: 'Farbschema'
				},
				{
					label: 'Klassifikation'
				}
			]
		},
		{
			label: 'Hilfe',
			submenu:
			[
				{
					label: 'hin&weg Webseite'
				},
				{
					label: 'Dokumentation'
				},
				{
					label: 'Tutorials'
				},
				{
					label: 'Kontexthilfe'
				}
			]
		}
	]

	public static MENU: boolean = Config.getValue("global", "menu");

	public static getMainMenu(): Menu | null
	{
		if (MainMenu.MENU) return Menu.buildFromTemplate(MainMenu.template);
		return null;
	}

}