import csv
import json
from datetime import datetime
import os


def safe_get(row, key, default=None):
    """Safely get a value from a row, return default if key doesn't exist"""
    return row.get(key, default)

def safe_float(value, default=None):
    """Safely convert a value to float"""
    if not value:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int(value, default=None):
    """Safely convert a value to int"""
    if not value:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def load_generation_descriptions(csv_file):
    descriptions = {}
    with open(csv_file, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            descriptions[int(row['Generation number'])] = row['Description']
    return descriptions

def load_state_legend(csv_file):
    states = {}
    with open(csv_file, 'r') as file:
        csv_reader = csv.reader(file)  
        for row in csv_reader:
            if len(row) >= 2:  
                states[int(row[0])] = row[1]  
    return states

def load_reconfigurations(csv_file):
    """Load reconfiguration mappings from carbon_location.csv"""
    reconfig_columns = {}
    with open(csv_file, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            number = safe_int(safe_get(row, 'Reconfiguration number'))
            if number:
                reconfig_columns[number] = {
                    'name': safe_get(row, 'Reconfiguration name'),
                    'description': safe_get(row, 'Description'),
                    'date': safe_get(row, 'Date')
                }
    return reconfig_columns

def convert_carbon_locations_to_json(csv_file):
    reconfigurations = []
    
    with open(csv_file, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            # Skip empty rows
            if not row['Reconfiguration number']:
                continue
                
            # Parse coordinates
            coords = row['Location coordinates'].replace('° N', '').replace('° W', '').replace('° E', '').split(',')
            lat = float(coords[0]) if coords[0].strip() else None
            # Convert West longitude to negative
            lon = float(coords[1]) if coords[1].strip() else None
            if 'W' in row['Location coordinates']:
                lon = -lon if lon else None
            
            number = int(row['Reconfiguration number'])
            reconfiguration = {
                "number": number,
                "serial": f"{number:04d}",  # Add serial field
                "name": row['Reconfiguration name'],
                "description": row['Description'], 
                "date": row['Date'].strip() if row['Date'] else None,
                "location": {
                    "name": row['Location name'],
                    "coordinates": {
                        "latitude": lat,
                        "longitude": lon
                    }
                },
                "pixel_weight": float(row['Pixel weight (kg)']) if row['Pixel weight (kg)'] else None,
                "coefficient": float(row['A1-A3 Coefficient']) if row['A1-A3 Coefficient'] else None,
                "a1_a3_emissions": float(row['A1-A3 emissions (kgCO2e)']) if row['A1-A3 emissions (kgCO2e)'] else None,
                "transport": {
                    "distance": float(row['Transport distance (km)']) if row['Transport distance (km)'] else 0,
                    "type": row['Type of transport'],
                    "coefficient": float(row['Transport coefficient (kgCO2e/kg)']) if row['Transport coefficient (kgCO2e/kg)'] else None,
                    "emissions": float(row['Carbon emissions (A4) (kgCO2e/pixel)']) if row['Carbon emissions (A4) (kgCO2e/pixel)'] else 0
                },
                "total_emissions": float(row['Total emissions per reconfiguration (kgCO2e/pixel)']) if row['Total emissions per reconfiguration (kgCO2e/pixel)'] else None
            }
            reconfigurations.append(reconfiguration)
            
    return {"reconfigurations": reconfigurations}

def convert_master_to_json(csv_file, generation_descriptions, state_legend, reconfig_columns):
    pixels = []
    
    with open(csv_file, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            if not safe_get(row, 'Pixel number'):
                continue
                
            reconfigurations = {}
            for i in range(1, 16):
                # Check if the column exists in the CSV
                column_name = f"Reconfiguration {i}"
                if column_name in row:
                    value = safe_get(row, column_name, '').strip()
                    # Convert to boolean - "1" means true, anything else is false
                    reconfigurations[str(i)] = value == "1"
            
            generation = safe_int(safe_get(row, 'Generation'))
            state = safe_int(safe_get(row, 'State'))
            
            pixel = {
                "pixel_number": safe_int(safe_get(row, 'Pixel number')),
                "generation": generation,
                "generation_description": generation_descriptions.get(generation) if generation else None,
                "state_description": state_legend.get(state) if state else None,
                "state": state,
                "fc": safe_float(safe_get(row, "fc'")),
                "weight": safe_float(safe_get(row, 'Weight (kg)')),
                "carbon_emissions_a1_a3": None,
                "concrete_mix": safe_get(row, 'Concrete mix', '').strip() or None,
                "fiber": {
                    "type": safe_get(row, 'Fiber type', '').strip() or None,
                    "dosage": safe_get(row, 'Fiber dosage', '').strip() or None
                },
                "date_of_manufacture": safe_get(row, 'Date of manufacture'),
                "number_of_reconfigurations": safe_int(safe_get(row, 'Number of reconfigurations at present')),
                "reconfigurations": reconfigurations,
                "gif": safe_get(row, 'GIF', '').lower() == 'yes',
                "notes": safe_get(row, 'notes')
            }
            pixels.append(pixel)
    
    return {"pixels": pixels}

def create_timeline_json(master_csv, carbon_locations_csv):
    carbon_data = {}
    with open(carbon_locations_csv, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            reconfig_num = safe_int(safe_get(row, 'Reconfiguration number'))
            if not reconfig_num:
                continue
                
            carbon_data[reconfig_num] = {
                'name': safe_get(row, 'Reconfiguration name'),
                'description': safe_get(row, 'Description'),
                'date': safe_get(row, 'Date'),
                'location': {
                    'name': safe_get(row, 'Location name'),
                    'coordinates': {
                        'latitude': safe_float(safe_get(row, 'Location coordinates', '').split('° N')[0]),
                        'longitude': safe_float(safe_get(row, 'Location coordinates', '').split(',')[1].replace('° W', '').replace('° E', '').strip()) * 
                            (-1 if '° W' in safe_get(row, 'Location coordinates', '') else 1)
                    }
                },
                'transport': {
                    'type': safe_get(row, 'Type of transport'),
                    'distance': safe_float(safe_get(row, 'Transport distance (km)'), 0),
                    'emissions': safe_float(safe_get(row, 'Carbon emissions (A4) (kgCO2e/pixel)'), 0)
                },
                'a1_a3_emissions': safe_float(safe_get(row, 'A1-A3 emissions (kgCO2e)'), 0)
            }

    pixels_timeline = []
    with open(master_csv, 'r') as file:
        csv_reader = csv.DictReader(file)
        column_headers = csv_reader.fieldnames
        
        reconfig_columns = {}
        for header in column_headers:
            if header.startswith('Reconfiguration'):
                try:
                    num = int(header.split('(')[0].replace('Reconfiguration', '').strip())
                    reconfig_columns[num] = header
                except (ValueError, IndexError):
                    continue

        for row in csv_reader:
            pixel_number = safe_int(safe_get(row, 'Pixel number'))
            if not pixel_number:
                continue

            reconfigurations = []
            for num, column in reconfig_columns.items():
                if safe_get(row, column, '').strip() == '1':
                    reconfigurations.append(num)

            if not reconfigurations:
                continue

            timeline = []
            cumulative_emissions = 0
            cumulative_distance = 0
            
            for step, reconfig_num in enumerate(reconfigurations, 1):
                if reconfig_num not in carbon_data:
                    continue
                    
                reconfig_data = carbon_data[reconfig_num]
                
                a1_a3 = reconfig_data['a1_a3_emissions'] if step == 1 else 0
                transport_emissions = reconfig_data['transport']['emissions']
                step_distance = reconfig_data['transport']['distance']
                
                cumulative_emissions += (a1_a3 + transport_emissions)
                cumulative_distance += step_distance

                timeline_entry = {
                    "step": step,
                    "reconfiguration_number": reconfig_num,
                    "name": reconfig_data['name'],
                    "date": reconfig_data['date'],
                    "location": reconfig_data['location'],
                    "emissions": {
                        "a1_a3": a1_a3,
                        "transport": transport_emissions,
                        "step_total": a1_a3 + transport_emissions,
                        "running_total": cumulative_emissions
                    },
                    "transport": {
                        "type": reconfig_data['transport']['type'],
                        "distance": step_distance,
                        "cumulative_distance": cumulative_distance
                    },
                    "description": reconfig_data['description']
                }
                timeline.append(timeline_entry)

            if timeline:
                pixel_timeline = {
                    "pixel_number": pixel_number,
                    "timeline": timeline,
                    "total_emissions": cumulative_emissions,
                    "total_distance": cumulative_distance
                }
                pixels_timeline.append(pixel_timeline)

    return {"pixels": pixels_timeline}

def create_individual_pixel_files(master_data, timeline_data):
    """Create individual JSON files for each pixel with combined data"""
    pixel_files = {}
    
    # Create a lookup for timeline data by pixel_number
    timeline_lookup = {pixel["pixel_number"]: pixel for pixel in timeline_data["pixels"]}
    
    for pixel in master_data["pixels"]:
        pixel_number = pixel["pixel_number"]
        
        # Create a deep copy of the pixel data
        pixel_data = dict(pixel)
        # Add the serialized identifier
        pixel_data["serial"] = f"{pixel_number:04d}"
        
        # Add timeline data if available
        if pixel_number in timeline_lookup:
            pixel_data["timeline"] = timeline_lookup[pixel_number]["timeline"]
            pixel_data["total_emissions"] = timeline_lookup[pixel_number]["total_emissions"]
            pixel_data["total_distance"] = timeline_lookup[pixel_number]["total_distance"]
        else:
            pixel_data["timeline"] = []
            pixel_data["total_emissions"] = 0
            pixel_data["total_distance"] = 0
            
        # Store pixel data with padded number as key
        pixel_files[f"{pixel_number:04d}"] = pixel_data
        
    return pixel_files

def create_simplified_pixels_json(master_data, timeline_data):
    """Create a simplified pixels.json with basic status information"""
    simplified_pixels = []
    
    # Create a lookup for timeline data by pixel_number
    timeline_lookup = {pixel["pixel_number"]: pixel for pixel in timeline_data["pixels"]}
    
    for pixel in master_data["pixels"]:
        pixel_number = pixel["pixel_number"]
        
        # Get timeline data if available
        total_distance = 0
        total_emissions = 0
        emissions_over_time = {}
        
        if pixel_number in timeline_lookup:
            total_distance = timeline_lookup[pixel_number]["total_distance"]
            total_emissions = timeline_lookup[pixel_number]["total_emissions"]
            
            # Create emissions over time dictionary
            for entry in timeline_lookup[pixel_number]["timeline"]:
                if entry["date"]:
                    # Use the date as key and running total as value
                    emissions_over_time[entry["date"]] = entry["emissions"]["running_total"]
        
        simplified_pixel = {
            "pixel_number": pixel["pixel_number"],
            "serial": f"{pixel['pixel_number']:04d}",  # Add serial field
            "generation": pixel["generation"],
            "state": pixel["state"],
            "state_description": pixel["state_description"],
            "number_of_reconfigurations": pixel["number_of_reconfigurations"],
            "distance_traveled": total_distance,
            "date_of_manufacture": pixel["date_of_manufacture"],
            "total_emissions": total_emissions,
            "emissions_over_time": emissions_over_time
        }
        simplified_pixels.append(simplified_pixel)
        
    return {"pixels": simplified_pixels}

def main():
    # Update paths to match the new public folder structure
    base_path = 'public/data/originals'
    output_base_path = 'public/data/bank'
    
    generation_descriptions = load_generation_descriptions(f'{base_path}/generation_description.csv')
    state_legend = load_state_legend(f'{base_path}/state_legend.csv')
    reconfig_columns = load_reconfigurations(f'{base_path}/carbon_location.csv')
    
    carbon_locations_data = convert_carbon_locations_to_json(f'{base_path}/carbon_location.csv')
    master_data = convert_master_to_json(f'{base_path}/master.csv', generation_descriptions, state_legend, reconfig_columns)
    timeline_data = create_timeline_json(f'{base_path}/master.csv', f'{base_path}/carbon_location.csv')
    
    # Generate individual pixel files and simplified pixels.json
    pixel_files = create_individual_pixel_files(master_data, timeline_data)
    simplified_pixels = create_simplified_pixels_json(master_data, timeline_data)
    
    # Create directories if they don't exist
    os.makedirs(f'{output_base_path}/assembly', exist_ok=True)
    os.makedirs(f'{output_base_path}/pixel', exist_ok=True)
    
    # Save assemblies.json (renamed from carbon_locations.json)
    with open(f'{output_base_path}/assembly/assemblies.json', 'w') as f:
        json.dump(carbon_locations_data, f, indent=2)
    
    # Save simplified pixels.json
    with open(f'{output_base_path}/pixel/pixels.json', 'w') as f:
        json.dump(simplified_pixels, f, indent=2)

    # Save individual pixel files
    for pixel_number, pixel_data in pixel_files.items():
        filename = f'pixel_{pixel_number}.json'  # pixel_number is already formatted
        with open(f'{output_base_path}/pixel/{filename}', 'w') as f:
            json.dump(pixel_data, f, indent=2)
            
    # Don't save the original master.json and timeline.json anymore
    # as they've been replaced with the new files

if __name__ == "__main__":
    main() 