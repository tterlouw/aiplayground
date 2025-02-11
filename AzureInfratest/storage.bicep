@minLength(3)
@maxLength(24)
param storageAccountName string

param location string = resourceGroup().location

param containerName string = 'fileuploads'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
    supportsHttpsTrafficOnly: true
  }
}

resource container 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource fileUploads 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
    name: containerName
    properties: {
      publicAccess: 'None'
    }
  }

output storageAccountId string = storageAccount.id
output storageAccountName string = storageAccount.name
