import { NavigationExtras, Params } from '@angular/router';
import { NodeHelper } from './node-helper';
import { IItem } from '../interfaces/item.interface';
import dayjs, { Dayjs } from 'dayjs';
import { INode } from '../interfaces/node.interface';

export interface INavigationTarget {
  route: Array<any>;
  extras?: NavigationExtras;
}

export class NavigationHelper {
  /** Gets a link to navigate to the items page with the item selected. */
  static getItemLink(item: IItem): INavigationTarget | undefined {
    return {
      route: ['/item'],
      extras: {
        queryParams: {
          type: item.type,
          item: item.guid
        }
      }
    }
  }

  /** Gets a link to navigates to the source of the given item (i.e. spirit). */
  static getItemSource(item: IItem): INavigationTarget | undefined {
    // Find spirit from last appearance of item.
    if (item.nodes?.length || item.hiddenNodes?.length) {
      const nodes = [ ...(item.nodes || []), ...(item.hiddenNodes || []) ];
      let lastNode: INode | undefined;
      let lastDate = dayjs('2000-1-1');
      for (const node of nodes) {
        // Prioritize unlocked node.
        if (node.unlocked) {
          lastNode = node;
          break;
        }

        const tree = NodeHelper.getRoot(node)?.spiritTree;
        if (!tree) { continue; }

        const date = tree?.eventInstanceSpirit?.eventInstance ? tree.eventInstanceSpirit.eventInstance.date
          : tree?.ts ? tree.ts.date
          : tree?.visit ? tree.visit.return.date
          : dayjs('2000-1-2');

        if (date.diff(lastDate) < 0) { continue; }
        lastDate = date;
        lastNode = node;
      }

      if (!lastNode) { return undefined; }
      const tree = NodeHelper.getRoot(lastNode)?.spiritTree;
      const extras: NavigationExtras = { queryParams: { highlightItem: item.guid }};

      const spirit = tree?.spirit ?? tree?.ts?.spirit ?? tree?.visit?.spirit;
      if (tree?.eventInstanceSpirit) {
        return { route: ['/event-instance', tree.eventInstanceSpirit.eventInstance!.guid], extras };
      } else if (spirit) {
        return { route: ['/spirit', spirit.guid], extras };
      }
    } else if (item.iaps?.length) {
      // Find shop in priority of unlocked > permanent > last appearance.
      const iap = item.iaps.find(iap => iap.bought)
        || item.iaps.find(iap => iap?.shop?.permanent)
        || item.iaps.at(-1);
      const shop = iap?.shop;
      const nav: NavigationExtras = { queryParams: { highlightIap: iap?.guid }};
      if (shop?.permanent) {
        return { route: ['/shop'], extras: nav };
      } else if (shop?.event) {
        return { route: ['/event-instance', shop.event.guid], extras: nav };
      } else if (shop?.season) {
        return { route: ['/season', shop.season.guid], extras: nav };
      }
    }

    return undefined;
  }

  static getPreviewLink(item: IItem): string {
    let type: string;
    switch (item.type) {
      case 'Hat': type = 'Hair_Accessories'; break;
      case 'Hair': type = 'Hair'; break;
      case 'Mask': type = 'Masks'; break;
      case 'FaceAccessory': type = 'Face_Accessories'; break;
      case 'Necklace': type = 'Necklaces'; break;
      case 'Outfit': type = 'Outfits'; break;
      case 'Shoes': type = 'Shoes'; break;
      case 'Cape': type = 'Capes'; break;
      case 'Instrument': type = 'Props'; break;
      case 'Held': type = 'Props'; break;
      case 'Prop': type = 'Props'; break;
      default: type = '';
    }

    if (!type) return '';
    const url = new URL(`https://sky-children-of-the-light.fandom.com/wiki/${type}`);
    const spiritTree = NodeHelper.getRoot(item.nodes?.at(-1) ?? item.hiddenNodes?.at(-1))?.spiritTree
    const spirit = spiritTree?.spirit ?? spiritTree?.ts?.spirit ?? spiritTree?.visit?.spirit;

    // Select preview item automatically
    if (spirit) {
      url.searchParams.append('tabber-active', spirit.name);
    } else {
      url.searchParams.append('tabber-active', item.name);
    }

    // Jump to preview section.
    url.hash = item.type === 'Held' || item.type === 'Instrument' ? 'Held_Props_Display'
      : item.type === 'Prop' ? 'Placeable_Props_Display' : 'Display';

    return url.toString();
  }

  static getQueryParams(href: string | URL): Params {
    const url = href instanceof URL ? href : new URL(href);
    const params: Params = {};
    for (const [k,v] of url.searchParams.entries()) { params[k] = v; }
    return params;
  }
}