import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Dashboard
import { DashboardComponent } from './dashboard/dashboard.component';

// Mappings
import { MappingsComponent } from './mappings/mappings.component';
import { AddOrUpdateMappingModalComponent } from './mappings/add-or-update-mapping/add-or-update-mapping.component';

// Credentials
import { CredentialsComponent } from './credentials/credentials.component';
import { AddOrUpdateCredentialModalComponent } from './credentials/add-or-update-credential/add-or-update-credential.component';

// Adapters
import { AdaptersComponent } from './adapters/adapters.component';
import { AddOrUpdateAdapterModalComponent } from './adapters/add-or-update-adapter/add-or-update-adapter.component';

// Sync Logs
import { SyncLogsComponent } from './sync-logs/sync-logs.component';

// Webhooks
import { WebhooksComponent } from './webhooks/webhooks.component';

// Playground
import { PlaygroundComponent } from './playground/playground.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'integration-config',
    children: [
      { path: 'mappings', component: MappingsComponent },
      { path: 'credentials', component: CredentialsComponent },
      { path: 'adapters', component: AdaptersComponent },
      { path: '', redirectTo: 'mappings', pathMatch: 'full' },
    ],
  },
  {
    path: 'logs',
    children: [
      { path: 'sync-logs', component: SyncLogsComponent },
      { path: 'webhooks', component: WebhooksComponent },
      { path: '', redirectTo: 'sync-logs', pathMatch: 'full' },
    ],
  },
  { path: 'playground', component: PlaygroundComponent },
];

import { NzTabsModule } from 'ng-zorro-antd/tabs';

@NgModule({
  declarations: [
    DashboardComponent,
    MappingsComponent,
    AddOrUpdateMappingModalComponent,
    CredentialsComponent,
    AddOrUpdateCredentialModalComponent,
    AdaptersComponent,
    AddOrUpdateAdapterModalComponent,
    SyncLogsComponent,
    WebhooksComponent,
    PlaygroundComponent,
  ],
  imports: [SharedModule, NzTabsModule, RouterModule.forChild(routes)],
})
export class MainModule {}
