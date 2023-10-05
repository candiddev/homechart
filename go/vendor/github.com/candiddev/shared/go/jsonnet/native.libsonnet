{
  getConfig():: std.native('getConfig')(),
  getEnv(key):: std.native('getEnv')(key),
  getPath(path):: std.native('getPath')(path),
  getRecord(type, name):: std.native('getRecord')(type, name),
  regexMatch(regex, string):: std.native('regexMatch')(regex, string),
}
