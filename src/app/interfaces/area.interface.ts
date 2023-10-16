import { IConfig, IGuid } from "./base.interface";
import { IRealm } from "./realm.interface";
import { IReturningSpirits } from './returning-spirits.interface';
import { ISpirit } from "./spirit.interface";
import { IWiki } from "./wiki.interface";
import { IWingedLight } from "./winged-light.interface";

export interface IAreaConfig extends IConfig<IArea> {}

export interface IArea extends IGuid {
  name: string;

  /// References ///
  realm?: IRealm;
  spirits?: Array<ISpirit>;
  wingedLights?: Array<IWingedLight>;
  rs?: Array<IReturningSpirits>;

  _wiki?: IWiki;
}