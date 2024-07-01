# Vasim Energy
Home Assistant addon and integration to periodically fetch energy consumption from the Vasim into HA.

## Installation
Add the Priva Proxy repository to the Home Assistant add-on store and install the Priva Proxy add-on.

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2F10KB%2Fvasim-energy.git)

## Determine value IDs
Open the Priva Portal and navigate to the page where you want to scrape the energy consumption from. Note the last part of the URI slug  and the `data-id` attribute value from the DOM. For example `buildingsection26` and `e23cc16b-2052-478d-8b46-50cc061d4110`.

## Define API body payload
With the selected URI slugs and `data-id` values you can write a payload that you can POST to the Priva Proxy API and it will scrape and return the values of the requested `data-id` fields. The root keys of your payload are free to determine, the nested `section` and `fields` need to contain the values from the previous step. Note that you can scrape from multiple sections and fields simultaneously.

Example payload:
```json
{
  "electricity": {
    "section": "buildingsection26",
    "fields": [
      "e23cc16b-2052-478d-8b46-50cc061d4110"
    ]
  },
  "venting": {
    "section": "module230",
    "fields": [
      "fa808874-0b13-4be1-be90-fc55a8f39a65",
      "8de59e2f-a77d-4b02-bc5e-4dc844ea4bce"
    ]
  }
}
```

## Setup sensors
Create the REST-based sensor in Home Assistant by adding the following to your `configuration.yml`. Restart HA after writing the configuration:

```yaml
rest:
  - resource: http://127.0.0.1:3000/api
    method: POST
    payload: |
      {
        "electricity": {
          "section": "buildingsection26",
          "fields": [
            "e23cc16b-2052-478d-8b46-50cc061d4110"
          ]
        },
        "venting": {
          "section": "module230",
          "fields": [
            "fa808874-0b13-4be1-be90-fc55a8f39a65",
            "8de59e2f-a77d-4b02-bc5e-4dc844ea4bce"
          ]
        }
      }
    scan_interval: 3600
    sensor:
      - name: "Electricity total"
        value_template: "{{ value_json.electricity[0] }}"
      - name: "Return temperature"
        value_template: "{{ value_json.venting[0] }}"
      - name: "Flow temperature"
        value_template: "{{ value_json.venting[1] }}"
```
