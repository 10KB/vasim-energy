# Vasim Energy
Home Assistant addon and integration to periodically fetch energy consumption from the Vasim into HA.

## Installation
Add the Priva Proxy repository to the Home Assistant add-on store and install the Priva Proxy add-on.

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2F10KB%2Fvasim-energy.git)

## Configuration
Set a valid e-mail address and password that can be used to log into the Priva Portal. Optionally you can change the default log level to `http` or `debug` to receive more information in the add-on log stream.

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
  "ventilation": {
    "section": "module230",
    "fields": [
      "fa808874-0b13-4be1-be90-fc55a8f39a65",
      "8de59e2f-a77d-4b02-bc5e-4dc844ea4bce"
    ]
  }
}
```

## Setup sensors
Create the REST-based sensor in Home Assistant by adding the following to your `configuration.yml`. Restart HA after writing the configuration. Make sure to set the correct `device_class`, `state_class` and `unit_of_measurement` for each sensor to be useful in Home Assistant.

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
        "ventilation": {
          "section": "module230",
          "fields": [
            "fa808874-0b13-4be1-be90-fc55a8f39a65",
            "8de59e2f-a77d-4b02-bc5e-4dc844ea4bce"
          ]
        }
      }
    scan_interval: 1800
    timeout: 60
    sensor:
      - name: "Electricity total"
        unique_id: electricity_total
        value_template: "{{ value_json.electricity[0] }}"
        device_class: energy
        state_class: total
        unit_of_measurement: kWh

      - name: "Return temperature"
        unique_id: ventilation_return_temperature
        value_template: "{{ value_json.ventilation[0] }}"
        device_class: temperature
        state_class: measurement
        unit_of_measurement: °C

      - name: "Flow temperature"
        unique_id: ventilation_flow_temperature
        value_template: "{{ value_json.ventilation[1] }}"
        device_class: temperature
        state_class: measurement
        unit_of_measurement: °C
```
