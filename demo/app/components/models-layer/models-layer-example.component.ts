import { Observable, of as observableOf, Subscriber } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { WebSocketSupplier } from '../../utils/services/webSocketSupplier/webSocketSupplier';
import { TracksDataProvider } from '../../utils/services/dataProvider/tracksDataProvider.service';

@Component({
  selector: 'models-layer-example',
  template: `
    <ac-layer acFor="let track of simTracks$" [context]="this">
      <ac-model-desc props="{
														position: track.position,
														minimumPixelSize: 100,
														maximumScale : 20000,
														uri: '/assets/CesiumAir/Cesium_Air.gltf',
														orientation: track.orientation
														}">
      </ac-model-desc>
    </ac-layer>
  `,
  providers: [TracksDataProvider]
})
export class ModelsLayerExampleComponent implements OnInit {

  simTracks$: Observable<AcNotification> = observableOf({
    id: '1',
    actionType: ActionType.ADD_UPDATE,
    entity: {}
  });

  Cesium = Cesium;
  show = true;

  constructor(webSocketSupllier: WebSocketSupplier) {
    const socket = webSocketSupllier.get();
    this.simTracks$ = Observable.create((observer: Subscriber<any>) => {
      socket.on('birds', (data: any) => {
        data.forEach(
          (acNotification: any) => {
            if (acNotification.action === 'ADD_OR_UPDATE') {
              acNotification.actionType = ActionType.ADD_UPDATE;
              acNotification.entity = new AcEntity(this.convertToCesiumObj(acNotification.entity));
            } else if (acNotification.action === 'DELETE') {
              acNotification.actionType = ActionType.DELETE;
            }
            observer.next(acNotification);
          });
      });
    });
  }

  convertToCesiumObj(entity: any): any {

    const fixedHeading = entity.heading - (Math.PI / 2);
    const heading = fixedHeading;
    const pitch = Cesium.Math.toRadians(0.0);
    const roll = Cesium.Math.toRadians(0.0);

    entity.scale = entity.id === 1 ? 0.3 : 0.15;
    entity.alt = Math.round(entity.position.altitude);
    entity.position = Cesium.Cartesian3.fromDegrees(entity.position.long, entity.position.lat, entity.alt);
    entity.futurePosition =
      Cesium.Cartesian3.fromDegrees(entity.futurePosition.long, entity.futurePosition.lat, entity.futurePosition.altitude);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(entity.position, hpr);

    return entity;
  }

  ngOnInit() {
  }


}
