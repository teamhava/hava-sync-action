# Hava Github Action

github action for integrating Hava with your github pipelines, allowing you to automatically synchronize and export a diagram after you have deployed changes to your environment

## Usage

```yml

```

## Input Options


|Input|Description|Required|Default|
|-|-|-|-|
|source_id|ID of the Hava source to synchronize|y||
|hava_token|API token to access Hava API|y||
|environment_id|ID of the Hava environment to generate png archicture diagram from. (Optional if `skip_export` is true)|n||
|view_type|Type of view to generate a png diagram for. Supported values: infrastructure, container, security. (Optional if `skip_export` is true)|n||
|image_path|Path to export png image to|n|docs/architecture.png|
|skip_export|Allows you to skip exports if you don't require the generated diagram|n|false|

## Outputs

|Output|Description|
|-|-|
|path|Path to the exported image file in the repo|