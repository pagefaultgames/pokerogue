import json

# Read package.json
with open('package.json', 'r') as package_file:
  package_data = json.load(package_file)

# Read package-lock.json
with open('package-lock.json', 'r') as lock_file:
  lock_data = json.load(lock_file)

# Bump version
version = package_data['version']
version_parts = version.split('.')
version_parts[-1] = str(int(version_parts[-1]) + 1)
new_version = '.'.join(version_parts)

# Update package.json
package_data['version'] = new_version
with open('package.json', 'w') as package_file:
  json.dump(package_data, package_file, indent=2)

# Update package-lock.json
lock_data['version'] = new_version
with open('package-lock.json', 'w') as lock_file:
  json.dump(lock_data, lock_file, indent=2)

print(f'Version bumped to {new_version}')
