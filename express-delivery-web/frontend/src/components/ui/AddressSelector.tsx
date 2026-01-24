'use client';

import { useState, useEffect } from 'react';
import { Address } from '@/types';
import { addressApi } from '@/utils/api';
import { Button } from './Button';
import { Card } from './Card';

interface AddressSelectorProps {
  onSelect: (address: Address) => void;
  onClose: () => void;
  selectedAddressId?: string;
}

export function AddressSelector({ onSelect, onClose, selectedAddressId }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await addressApi.getAddresses();
      if (response.success && response.data) {
        const data = response.data as { addresses?: Address[] };
        setAddresses(data.addresses || []);
      } else {
        setError('加载地址列表失败');
      }
    } catch (err) {
      console.error('加载地址失败:', err);
      setError('加载地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (address: Address) => {
    onSelect(address);
    onClose();
  };

  const formatAddress = (address: Address) => {
    return `${address.province}${address.city}${address.district}${address.address}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">选择地址</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : addresses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>暂无地址记录</p>
              <p className="text-sm mt-2">请先在地图上选择地址</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => handleSelect(address)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAddressId === address.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{address.name}</span>
                        <span className="text-gray-600">{address.phone}</span>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                            默认
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm">{formatAddress(address)}</p>
                    </div>
                    {selectedAddressId === address.id && (
                      <div className="text-blue-600 ml-4">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            取消
          </Button>
        </div>
      </Card>
    </div>
  );
}
