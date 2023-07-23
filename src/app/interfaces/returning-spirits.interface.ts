import { IConfig, IGuid } from "./base.interface";
import { ISpiritTree } from "./spirit-tree.interface";
import { IDate } from "./date.interface";
import { ISpirit } from "./spirit.interface";
import dayjs from 'dayjs';

export interface IReturningSpiritsConfig extends IConfig<IReturningSpirits> {}

export interface IReturningSpirits extends IGuid {
  /** Name of the occassion. */
  name?: string;
  /** First day of TS visit. */
  date: dayjs.Dayjs;
  /** Last day of TS visit. */
  endDate: dayjs.Dayjs;

  /** Visiting spirits. */
  spirits: Array<IReturningSpirit>;
}

export interface IReturningSpirit extends IGuid {
  /// References ///
  return: IReturningSpirits;
  spirit: ISpirit;
  tree: ISpiritTree;
}