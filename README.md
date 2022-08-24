# Hava Github Action

github action for integrating Hava with your github pipelines, allowing you to automatically synchronize and export a diagram after you have deployed changes to your environment

## Usage

To use the action in your own repository, include it as a step in your job

```yml
- uses: teamhava/hava-sync-action@v1
  with:
    source_id:
    hava_token: 
    environment_id: 
    view_type:
```

An example of this action in use can be found in our [example repo](https://github.com/teamhava/example-github-action)

### Usage without image generation

At times you don't need to generate a new image, you only want to synchronize the lates changes to Hava. To support that you can set the `skip_export` variable to true. In these cases you will not need to set the `environment_id` or `view_type` variables.

```yml
- uses: teamhava/hava-sync-action@v1
  with:
    source_id:
    hava_token: 
    skip_export: true
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