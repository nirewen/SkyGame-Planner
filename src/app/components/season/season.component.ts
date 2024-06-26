import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SubscriptionLike } from 'rxjs';
import { DateHelper } from 'src/app/helpers/date-helper';
import { NodeHelper } from 'src/app/helpers/node-helper';
import { IIAP } from 'src/app/interfaces/iap.interface';
import { INode } from 'src/app/interfaces/node.interface';
import { ISeason } from 'src/app/interfaces/season.interface';
import { IShop } from 'src/app/interfaces/shop.interface';
import { IRevisedSpiritTree, ISpiritTree } from 'src/app/interfaces/spirit-tree.interface';
import { ISpirit } from 'src/app/interfaces/spirit.interface';
import { DataService } from 'src/app/services/data.service';
import { EventService } from 'src/app/services/event.service';
import { IAPService } from 'src/app/services/iap.service';
import { TitleService } from 'src/app/services/title.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.less']
})
export class SeasonComponent implements OnDestroy {
  season!: ISeason;
  state: 'future' | 'active' | 'ended' | undefined;
  highlightIap?: string;
  highlightTree?: string;

  guide?: ISpirit;
  guideTree?: ISpiritTree;
  spirits: Array<ISpirit> = [];
  spiritTrees: { [guid: string]: ISpiritTree } = {};
  shops: Array<IShop> = [];
  iapShops: Array<IShop> = [];

  nodes: Set<INode> = new Set();

  sc: number = 0;
  scLeft: number = 0;
  sh: number = 0;
  shLeft: number = 0;

  private _itemSub?: SubscriptionLike;

  constructor(
    private readonly _dataService: DataService,
    private readonly _eventService: EventService,
    private readonly _iapService: IAPService,
    private readonly _titleService: TitleService,
    private readonly _route: ActivatedRoute
  ) {
    _route.queryParamMap.subscribe(p => this.onQueryChanged(p));
    _route.paramMap.subscribe(p => this.onParamsChanged(p));
    this.subscribeItemChanged();
  }

  ngOnDestroy(): void {
    this._itemSub?.unsubscribe();
  }

  subscribeItemChanged(): void {
    this._itemSub?.unsubscribe();
    this._itemSub = this._eventService.itemToggled
      .subscribe(v => this.onItemChanged());
  }

  onItemChanged(): void {
    this.calculateSc();
  }

  onQueryChanged(params: ParamMap): void {
    this.highlightIap = params.get('highlightIap') || undefined;
    this.highlightTree = params.get('highlightTree') || undefined;
  }

  onParamsChanged(params: ParamMap): void {
    const guid = params.get('guid');
    this.initializeSeason(guid!);
  }

  private initializeSeason(guid: string): void {
    this.season = this._dataService.guidMap.get(guid!) as ISeason;
    this.state = DateHelper.getStateFromPeriod(this.season.date, this.season.endDate);
    this._titleService.setTitle(this.season.name);

    this.guide = undefined;
    this.spirits = [];
    this.spiritTrees = {};
    this.season?.spirits?.forEach(spirit => {
      switch (spirit.type) {
        case 'Guide':
          this.guide = spirit;
          this.guideTree = spirit.treeRevisions?.findLast<IRevisedSpiritTree>(t => t.revisionType === 'DuringSeason') ?? spirit.tree;
          break;
        case 'Season':
          this.spirits.push(spirit);
          this.spiritTrees[spirit.guid] = spirit.treeRevisions?.findLast<IRevisedSpiritTree>(t => t.revisionType === 'DuringSeason') ?? spirit.tree!;
          break;
      }
    });

    const shops = this.season.shops ?? [];
    this.iapShops = shops.filter(s => s.iaps?.length);
    this.shops = shops.filter(s => s.itemList);
    this.calculateSc();
  }

  calculateSc(): void {
    this.sc = this.scLeft = this.sh = this.shLeft = 0;

    [this.guide, ...this.spirits].map(s => s?.tree).forEach(tree => {
      if (!tree) { return; }
      NodeHelper.all(tree.node).forEach(n => {
        this.sc += n.sc || 0;
        this.sh += n.sh || 0;
        if (!n.unlocked && !n.item?.unlocked) {
          this.scLeft += n.sc || 0;
          this.shLeft += n.sh || 0;
        }
      });
    });
  }

  togglePurchased(event: MouseEvent, iap: IIAP): void {
    this._iapService.togglePurchased(iap);
  }
}
