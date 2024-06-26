import { Injectable } from '@angular/core';
import { INode } from '../interfaces/node.interface';
import { StorageService } from './storage.service';
import { EventService } from './event.service';
import { IItemListNode } from '../interfaces/item-list.interface';

@Injectable({
  providedIn: 'root'
})
export class NodeService {

  constructor(
    private readonly _eventService: EventService,
    private readonly _storageService: StorageService
  ) { }

  unlock(node: INode | IItemListNode): boolean {
    if (!node?.item) { return false; }
    const guids: Array<string> = [];

    // Unlock the item.
    node.item.unlocked = true;
    guids.push(node.item.guid);

    // Unlock the node to track costs. Other nodes are not unlocked but will appear unlocked by the item status.
    node.unlocked = true;
    guids.push(node.guid);

    // Unlock hidden items.
    (node as INode).hiddenItems?.forEach(item => {
      item.unlocked = true;
      guids.push(item.guid);
    });

    // Save data.
    this._storageService.addUnlocked(...guids);

    // Notify listeners.
    this._eventService.itemToggled.next(node.item);

    return true;
  }

  lock(node: INode | IItemListNode): boolean {
    if (!node?.item) { return false; }
    const guids: Array<string> = [];

    // Get all associated items.
    const hiddenItems = (node as INode).hiddenItems || [];
    const items = [node.item, ...hiddenItems];

    // Remove unlock from items.
    for (const item of items) {
      item.unlocked = false;
      guids.push(item.guid);

      // Remove unlock from all nodes that contain this item.
      const nodes = item.nodes || [];
      nodes.forEach(n => { n.unlocked = false; guids.push(n.guid); });

      // Remove unlock from all hidden nodes that contain this item.
      const hiddenNodes = item.hiddenNodes || [];
      hiddenNodes.forEach(n => { n.unlocked = false; guids.push(n.guid); });

      // Remove unlock from item list nodes that contain this item.
      const listNodes = item.listNodes || [];
      listNodes.forEach(n => { n.unlocked = false; guids.push(n.guid); });
    }

    // Save data.
    this._storageService.removeUnlocked(...guids);

    // Notify listeners.
    this._eventService.itemToggled.next(node.item);

    return true;
  }
}
