import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2px solid #1E40AF',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  date: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 5,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    padding: 8,
    flex: 1,
    fontSize: 10,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 10,
    color: '#6B7280',
  },
});

export const ReportTemplate = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logo}>{data.companyName}</Text>
        <Text style={styles.title}>{data.reportTitle}</Text>
        <Text style={styles.date}>{data.issueDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sumário Executivo</Text>
        <Text style={styles.body}>{data.executiveSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Item</Text>
            <Text style={styles.tableCell}>Valor</Text>
            <Text style={styles.tableCell}>Variação</Text>
          </View>
          {data.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.name}</Text>
              <Text style={styles.tableCell}>{item.value}</Text>
              <Text style={styles.tableCell}>{item.change}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.pageNumber}>Página 1</Text>
        <Text style={styles.pageNumber}>Confidencial</Text>
      </View>
    </Page>
  </Document>
);

export default ReportTemplate;