'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Calculator, RotateCcw, AlertCircle } from 'lucide-react'

interface SubnetResult {
  ipClass: string
  networkAddress: string
  broadcastAddress: string
  hostRange: {
    start: string
    end: string
  }
  subnetMask: string
  wildcardMask: string
  binaryRepresentation: {
    ip: string
    subnetMask: string
    networkAddress: string
  }
  totalSubnets: number
  hostsPerSubnet: number
  usableHosts: number
  cidr: number
}

interface LogEntry {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'error'
}

export default function SubnetCalculator() {
  const [ipAddress, setIpAddress] = useState('192.168.1.100')
  const [cidr, setCidr] = useState('24')
  const [result, setResult] = useState<SubnetResult | null>(null)
  const [errors, setErrors] = useState<{ ip?: string; cidr?: string }>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'host']))

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [{ timestamp, message, type }, ...prev].slice(0, 10))
  }

  const validateIP = (ip: string): boolean => {
    const octets = ip.split('.')
    if (octets.length !== 4) return false
    
    for (const octet of octets) {
      const num = parseInt(octet, 10)
      if (isNaN(num) || num < 0 || num > 255) return false
      if (octet !== num.toString()) return false
    }
    return true
  }

  const validateCIDR = (cidr: string): boolean => {
    const num = parseInt(cidr, 10)
    return !isNaN(num) && num >= 0 && num <= 32
  }

  const getIPClass = (ip: string): string => {
    const firstOctet = parseInt(ip.split('.')[0], 10)
    if (firstOctet >= 1 && firstOctet <= 126) return 'A'
    if (firstOctet >= 128 && firstOctet <= 191) return 'B'
    if (firstOctet >= 192 && firstOctet <= 223) return 'C'
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)'
    if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)'
    return 'Unknown'
  }

  const ipToLong = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }

  const longToIP = (long: number): string => {
    return [
      (long >>> 24) & 255,
      (long >>> 16) & 255,
      (long >>> 8) & 255,
      long & 255
    ].join('.')
  }

  const toBinary = (ip: string): string => {
    return ip.split('.').map(octet => 
      parseInt(octet, 10).toString(2).padStart(8, '0')
    ).join('.')
  }

  const calculateSubnet = () => {
    const newErrors: { ip?: string; cidr?: string } = {}
    
    if (!validateIP(ipAddress)) {
      newErrors.ip = 'Invalid IP address format'
    }
    
    if (!validateCIDR(cidr)) {
      newErrors.cidr = 'CIDR must be between 0 and 32'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      addLog('Validation failed', 'error')
      return
    }

    try {
      const cidrNum = parseInt(cidr, 10)
      const ipLong = ipToLong(ipAddress)
      
      const maskLong = (0xFFFFFFFF << (32 - cidrNum)) >>> 0
      const subnetMask = longToIP(maskLong)
      
      const networkLong = ipLong & maskLong
      const networkAddress = longToIP(networkLong)
      
      const broadcastLong = networkLong | (~maskLong >>> 0)
      const broadcastAddress = longToIP(broadcastLong)
      
      const hostStart = networkLong + 1
      const hostEnd = broadcastLong - 1
      const hostRange = {
        start: longToIP(hostStart),
        end: longToIP(hostEnd)
      }
      
      const wildcardMask = longToIP(~maskLong >>> 0)
      
      const totalSubnets = Math.pow(2, Math.max(0, cidrNum - 8))
      const hostsPerSubnet = Math.pow(2, 32 - cidrNum)
      const usableHosts = Math.max(0, hostsPerSubnet - 2)
      
      const result: SubnetResult = {
        ipClass: getIPClass(ipAddress),
        networkAddress,
        broadcastAddress,
        hostRange,
        subnetMask,
        wildcardMask,
        binaryRepresentation: {
          ip: toBinary(ipAddress),
          subnetMask: toBinary(subnetMask),
          networkAddress: toBinary(networkAddress)
        },
        totalSubnets,
        hostsPerSubnet,
        usableHosts,
        cidr: cidrNum
      }
      
      setResult(result)
      addLog(`Calculated subnet for ${ipAddress}/${cidr}`, 'success')
    } catch (error) {
      addLog('Calculation error', 'error')
    }
  }

  const reset = () => {
    setIpAddress('192.168.1.100')
    setCidr('24')
    setResult(null)
    setErrors({})
    addLog('Calculator reset', 'info')
  }

  useEffect(() => {
    addLog('Subnet Calculator initialized', 'info')
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 border-b-2 border-slate-600 rounded-t-lg p-4 mb-0">
          <h1 className="text-2xl font-bold text-cyan-400 font-mono">Nisco Subnet Calculator</h1>
          <p className="text-slate-300 text-sm mt-1">Network Subnet Calculation Tool</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Panel - Input */}
          <div className="w-full lg:w-1/3">
            <Card className="rounded-t-none border-t-0 border-2 border-slate-300 shadow-lg">
              <CardHeader className="bg-slate-200 border-b-2 border-slate-300">
                <CardTitle className="text-slate-800 font-mono text-lg">Input Parameters</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ip" className="text-slate-700 font-mono text-sm">IP Address:</Label>
                  <Input
                    id="ip"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="font-mono border-2 border-slate-300 focus:border-cyan-500"
                    placeholder="192.168.1.1"
                  />
                  {errors.ip && (
                    <Alert className="py-2 px-3 bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{errors.ip}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidr" className="text-slate-700 font-mono text-sm">CIDR Prefix:</Label>
                  <Input
                    id="cidr"
                    value={cidr}
                    onChange={(e) => setCidr(e.target.value)}
                    className="font-mono border-2 border-slate-300 focus:border-cyan-500"
                    placeholder="24"
                  />
                  {errors.cidr && (
                    <Alert className="py-2 px-3 bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{errors.cidr}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={calculateSubnet}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-mono border-2 border-cyan-700 rounded"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </Button>
                  <Button 
                    onClick={reset}
                    variant="outline"
                    className="flex-1 border-2 border-slate-400 hover:bg-slate-100 font-mono rounded"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1">
            <Card className="rounded-t-none border-t-0 border-2 border-slate-300 shadow-lg">
              <CardHeader className="bg-slate-200 border-b-2 border-slate-300">
                <CardTitle className="text-slate-800 font-mono text-lg">Calculation Results</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {result ? (
                  <div className="space-y-4">
                    {/* Basic Information */}
                    <Collapsible open={expandedSections.has('basic')} onOpenChange={() => toggleSection('basic')}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-mono text-sm font-semibold text-slate-700 hover:text-cyan-600">
                        {expandedSections.has('basic') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Basic Information
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="bg-slate-50 border border-slate-200 rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-sm">
                            <div className="text-slate-600">IP Class:</div>
                            <div className="text-slate-900 font-semibold">{result.ipClass}</div>
                            
                            <div className="text-slate-600">Network Address:</div>
                            <div className="text-slate-900 font-semibold">{result.networkAddress}</div>
                            
                            <div className="text-slate-600">Broadcast Address:</div>
                            <div className="text-slate-900 font-semibold">{result.broadcastAddress}</div>
                            
                            <div className="text-slate-600">Subnet Mask:</div>
                            <div className="text-slate-900 font-semibold">{result.subnetMask}</div>
                            
                            <div className="text-slate-600">Wildcard Mask:</div>
                            <div className="text-slate-900 font-semibold">{result.wildcardMask}</div>
                            
                            <div className="text-slate-600">CIDR:</div>
                            <div className="text-slate-900 font-semibold">/{result.cidr}</div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Host Information */}
                    <Collapsible open={expandedSections.has('host')} onOpenChange={() => toggleSection('host')}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-mono text-sm font-semibold text-slate-700 hover:text-cyan-600">
                        {expandedSections.has('host') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Host Information
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="bg-slate-50 border border-slate-200 rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-sm">
                            <div className="text-slate-600">Host Range:</div>
                            <div className="text-slate-900 font-semibold break-all">{result.hostRange.start} - {result.hostRange.end}</div>
                            
                            <div className="text-slate-600">Total Hosts:</div>
                            <div className="text-slate-900 font-semibold">{result.hostsPerSubnet.toLocaleString()}</div>
                            
                            <div className="text-slate-600">Usable Hosts:</div>
                            <div className="text-slate-900 font-semibold">{result.usableHosts.toLocaleString()}</div>
                            
                            <div className="text-slate-600">Total Subnets:</div>
                            <div className="text-slate-900 font-semibold">{result.totalSubnets.toLocaleString()}</div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Binary Representation */}
                    <Collapsible open={expandedSections.has('binary')} onOpenChange={() => toggleSection('binary')}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-mono text-sm font-semibold text-slate-700 hover:text-cyan-600">
                        {expandedSections.has('binary') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Binary Representation
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="bg-slate-900 text-green-400 border border-slate-600 rounded p-3">
                          <div className="space-y-1 font-mono text-xs overflow-x-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-cyan-400 flex-shrink-0">IP:</span>
                              <span className="break-all">{result.binaryRepresentation.ip}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-cyan-400 flex-shrink-0">Mask:</span>
                              <span className="break-all">{result.binaryRepresentation.subnetMask}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-cyan-400 flex-shrink-0">Network:</span>
                              <span className="break-all">{result.binaryRepresentation.networkAddress}</span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-mono">Enter IP address and CIDR to calculate subnet information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Bar */}
        <Card className="rounded-t-none border-2 border-t-0 border-slate-300 shadow-lg">
          <CardContent className="p-3 bg-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-cyan-400 font-mono text-sm">Status Log</div>
              <div className="text-slate-400 font-mono text-xs">
                {new Date().toLocaleString()}
              </div>
            </div>
            <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="font-mono text-xs flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    'text-cyan-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}